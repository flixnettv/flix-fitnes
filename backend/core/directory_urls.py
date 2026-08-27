from django.urls import path
from .directory import members_list, trainers_list, members_create, create_trainer_account
urlpatterns = [
    path("members/", members_list, name="gym-members"),
    path("members/create/", members_create, name="gym-members-create"),
    path("trainers/", trainers_list, name="gym-trainers"),
    path("create-trainer/", create_trainer_account, name="create-trainer-account"),
]
