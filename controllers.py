"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_user_name, get_user

url_signer = URLSigner(session)

# --------------
# gcs
import datetime
import json
import os
import traceback
import uuid
from nqgcs import NQGCS
from .settings import APP_FOLDER
from .gcs_url import gcs_url

BUCKET = '/post_image_uploads'

# GCS keys.  You have to create them for this to work.  See README.md
GCS_KEY_PATH = os.path.join(APP_FOLDER, 'private/gcs_keys.json')
with open(GCS_KEY_PATH) as gcs_key_f:
    GCS_KEYS = json.load(gcs_key_f)

# I create a handle to gcs, to perform the various operations.
gcs = NQGCS(json_key_path=GCS_KEY_PATH)
# --------------

@action('index')
@action.uses(db, auth, 'index.html')
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
        load_location_posts_url = URL('load_location_posts', signer=url_signer),
        add_location_post_url = URL('add_location_post', signer=url_signer),
        upload_image_url=URL('upload_image', signer=url_signer),
        obtain_gcs_url = URL('obtain_gcs', signer=url_signer),
        delete_post_url = URL('delete_post', signer=url_signer),
    )

# This is our very first API function.
@action('load_location_posts')
@action.uses(url_signer.verify(), db)
def load_location_posts():
    email = get_user_email()
    rows = db(db.location_posts).select().as_list()
    return dict(rows=rows, email = get_user_email())

@action('add_location_post', method="POST")
@action.uses(url_signer.verify(), db)
def add_location_post():
    name = get_user_name()
    email = get_user_email()
    print(request.json.get('latLng'),)
    id = db.location_posts.insert(
        post_description=request.json.get('post_description'),
        post_title=request.json.get('post_title'),
        image=request.json.get('image'),
        latLng=request.json.get('latLng'),
        name=name,
        email=email
    )
    return dict(id=id, name=name, email=email)

@action('delete_all', method=["GET", "POST", "DELETE"])
@action.uses(db, auth)
def delete():
    rows = db(db.location_posts).select()
    for row in rows:
        db(db.location_posts.id == row.id).delete()
    
    return "deleted", 200

@action('delete_post')
@action.uses(db, url_signer.verify())
def delete_post():
    id = request.params.get('id')
    assert id is not None
    db(db.location_posts.id == id).delete()
    redirect(URL('index'))
    return "ok"
						
'''
------------------------------------------------------
GCS routes
------------------------------------------------------
'''			
@action('upload_image', method="POST")
@action.uses(url_signer.verify(), db)
def upload_image():
    post_id = request.json.get('post_id')
    image = request.json.get('image')
    db(db.location_posts.id == post_id).update(image=image)
    return "ok"

def mark_possible_upload(file_path):
    """Marks that a file might be uploaded next."""
    delete_previous_uploads()
    db.upload.insert(
        owner=get_user_email(),
        file_path=file_path,
        confirmed=False,
    )

def delete_previous_uploads():
    """Deletes all previous uploads for a user, to be ready to upload a new file."""
    previous = db(db.upload.owner == get_user_email()).select()
    for p in previous:
        # There should be only one, but let's delete them all.
        delete_path(p.file_path)
    db(db.upload.owner == get_user_email()).delete()

def delete_path(file_path):
    """Deletes a file given the path, without giving error if the file
    is missing."""
    try:
        bucket, id = os.path.split(file_path)
        gcs.delete(bucket[1:], id)
    except:
        # Ignores errors due to missing file.
        pass

@action('obtain_gcs', method="POST")
@action.uses(url_signer.verify(), db)
def obtain_gcs():
    """Returns the URL to do download / upload / delete for GCS."""
    verb = request.json.get("action")
    if verb == "PUT":
        mimetype = request.json.get("mimetype", "")
        file_name = request.json.get("file_name")
        extension = os.path.splitext(file_name)[1]
        # Use + and not join for Windows, thanks Blayke Larue
        file_path = BUCKET + "/" + str(uuid.uuid1()) + extension
        file_url = "https://storage.googleapis.com/post_image_uploads/" + file_path.split(BUCKET + "/",1)[1] 
        # Marks that the path may be used to upload a file.
        mark_possible_upload(file_path)
        upload_url = gcs_url(GCS_KEYS, file_path, verb='PUT',
                             content_type=mimetype)
        return dict(
            signed_url=upload_url,
            file_path=file_path,
            add_post_image = file_url,
        )
    elif verb in ["GET", "DELETE"]:
        file_path = request.json.get("file_path")
        if file_path is not None:
            # We check that the file_path belongs to the user.
            r = db(db.upload.file_path == file_path).select().first()
            if r is not None and r.owner == get_user_email():
                # Yes, we can let the deletion happen.
                delete_url = gcs_url(GCS_KEYS, file_path, verb='DELETE')
                return dict(signed_url=delete_url)
        # Otherwise, we return no URL, so we don't authorize the deletion.
        return dict(signer_url=None)