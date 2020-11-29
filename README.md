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

#### static/css/index.css
###### css file for main content layout and progress bar style.

## templates/pages/Upload.html
Main page for user interaction.

#### templates/pages/Step2Components.html & Step3Components.html & Step4Components.html
###### Toolbox for masking, modulation, and download feature.

#### static/css/Upload.css
###### css file for layout and styling of components in main canvas and toolboxes.

## static/js/processor.js
Main javascript file that has functions for user modulation, model output request, etc.
