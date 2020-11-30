#!/bin/bash
pip install virtualenv
virtualenv engine/venv --python=python3.6.9
source engine/venv/bin/activate
pip install -U pip
pip install -r engine/requirements.txt
pip install flask
pip install gunicorn