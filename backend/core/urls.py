from django.urls import path
from .branding import branding, my_appearance, my_appearance_update
from .directory import members_list, trainers_list, members_create, create_trainer_account

urlpatterns = [
    path("branding/", branding, name="branding"),
    path("branding/me/", my_appearance, name="branding-me"),
    path("branding/me/update/", my_appearance_update, name="branding-me-update"),
    path("directory/members/", members_list, name="directory-members"),
    path("directory/trainers/", trainers_list, name="directory-trainers"),
    path("directory/members/create/", members_create, name="directory-members-create"),
    path("directory/trainer/create/", create_trainer_account, name="directory-trainer-create"),
]
