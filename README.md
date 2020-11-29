# [CS492F Project] ImageHackers
Breaking black-box of inpainting system with interactive UI

## main.py
Flask framework to deploy online & to transfer user request into AI.

## engine/__init__.py
Python functions that generates inpainted output and attention from model.

## templates/index.html
Progress bar and router.
#### static/js/index.js, static/js/router.js
###### Javascript file for progress bar/routing.

## templates/pages/Upload.html
Main page for user interaction.

#### templates/pages/Step2Components.html & Step3Components.html
###### Toolbox for modulation.

## static/js/processor.js
Main javascript file that has functions for user modulation, model output request, etc.
