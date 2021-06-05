"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_user():
    return auth.current_user.get('id') if auth.current_user else None

def get_user_name():
    return auth.current_user.get('first_name') +  " " + auth.current_user.get('last_name') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

db.define_table('location_posts',
                Field('post_description'),
                Field('post_title'),
                Field('name'),
                Field('email'),
                Field('latLng'),
                Field('image'),
                )

db.commit()
