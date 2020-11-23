#!/bin/bash
pip install virtualenv
python3 -m venv engine/venv
source engine/venv/bin/activate
pip install -U pip
pip install -r engine/requirements.txt
