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

@action('index')
@action.uses(db, auth, 'index.html')
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        my_callback_url = URL('my_callback', signer=url_signer),
        load_location_posts_url = URL('load_location_posts', signer=url_signer),
        add_location_post_url = URL('add_location_post', signer=url_signer),
        delete_post_url=URL('delete_post', signer=url_signer),
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

#
# @action('delete/<location_post_id:int>')
# @action.uses(db, session, auth.user)
# def delete(location_post_id=None):
#     print("controller")
#     assert location_post_id is not None
#     db(db.location_posts.id == location_post_id).delete()
#     redirect(URL('index'))

@action('delete_post')
@action.uses(db, url_signer.verify())
def delete_post():
    id = request.params.get('id')
    assert id is not None
    db(db.location_posts.id == id).delete()
    return "ok"
