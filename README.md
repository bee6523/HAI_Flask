# [CS492F Project] ImageHackers

# Project Summary
![eyecatcher](https://i.imgur.com/hENAd4y.png)

A black-box inpainting AI can ignore user intention without explanation, harming the user experience.
To solve the problem, we injected a backdoor to a trained black-box AI and connected it to an intuitive coloring UI.
Our approach allows a joint understanding & control of the inpainting process, and is fully unsupervised, unlike most of the interactive AI.

<div style="text-align:center">
<img src="https://i.imgur.com/s6Zf2T6.png" height="200"/>
</div>

Our framework supports three main types of interactions:
* AI-driven inpainting of an image's masked regions
* Visualization of AI decision via color-coded attention map
* Modulation of AI decision via painting UI

The second and third user interactions are realized with a unified, colored map representation of the model attention.
This is our novel and unique approach.
This is link for prototype: [KVPN required](http://143.248.133.65:4321/#).

# Dependency
`python` and `virtualenv` should suffice.
Every required packages are listed in `engine/requirements.txt`, and can be installed by running `./install.sh`.
After installation, activate the virtual environment in `engine/venv` by running `source ./activate.sh`.
We provide an exhaustive listup:

`tensorflow==1.5.0`,
`tensorflow-estimator==1.15.0`,
`tensorflow-probability==0.11.0`,
`matplotlib==3.3.1`,
`scikit-build`,
`opencv-python==4.4.0.42`,
`pyyaml`,
`git+git://github.com/JiahuiYu/neuralgym#egg=neuralgym`

# Implementation

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

# Instruction

<div style="text-align:center">
<img src="https://i.imgur.com/YRM1Y3H.png" width="400"/>
<img src="https://i.imgur.com/0pbDCKH.png" width="400"/>
</div>

In this section, we will further demonstrate how the image on the left can be inpainted to produce the image on the right.

1. Upload an image. Press `Next Step` and add masks. You can try both square & free-form masks, but we recommend non-overlapping squares because underlying AI is trained that way.
<div style="text-align:center">
<img src="https://i.imgur.com/x5I95I1.jpg" width="500"/>
</div>
<div style="text-align:center">
<img src="https://i.imgur.com/FmXkPha.png" width="500"/>
</div>

2. Press `Next Step`. An inpainted result by the AI will show up. You can stop here if you are satisfied.
<div style="text-align:center">
<img src="https://i.imgur.com/0MOJzHq.jpg" width="500"/>
</div>

3. If you want to *understand*, press `Modulate`. A colored map will appear on top of the masks. *The colored map denotes where the AI looks at*.
Specifically, each color denotes a source position where the AI draws information from. The *palatte* in the bottom-right corner provides the color-to-position mapping.
For example, in the below image, notice that the AI puts some pinkish red dots around the center of the mask. As pink corresponds to bottom-left region of the image (grass and sunflowers), you can notice that the AI uses information from there to inpaint the mask. This might explain the strange details in the inpainted cloud.

<div style="text-align:center">
<img src="https://i.imgur.com/SOrkxIk.jpg" width="500"/>
</div>

4. You might want to change the inpainting result. We provide *painting tools* for that. These are similar to a conventional painter, except that the palette is the image itself. For example, in the below picture, I used the color picker to select a region containing a sunflower. In the bottom-right palette, you can see that the region corresponds to pink and red colors.
<div style="text-align:center">
<img src="https://i.imgur.com/gNRcQU6.png" width="500"/>
</div>

5. After picking, you can *color the mask*. This will make the AI draw information from selected color (region) to fill-in the mask. In the below example, I intended the AI to use the sunflower (pink and red colors). If you are done, press `Convert`. A modified inpainting result will show up.
<div style="text-align:center">
<img src="https://i.imgur.com/btQtWNE.png" width="500"/>
</div>

<div style="text-align:center">
<img src="https://i.imgur.com/itBcCfI.jpg" width="500"/>
</div>

6. You can still press `Modulate` to keep on modulating. In the above example, I didn't like the subtle degradation around the sunflower, so I decided to color the region with clouds (yellow and blue colors). If you are satisfied, you can press `Next step`, and download the image or start again from the beginning.
<div style="text-align:center">
<img src="https://i.imgur.com/QFehly1.png" width="500"/>
</div>
<div style="text-align:center">
<img src="https://i.imgur.com/ntFeVDU.jpg" width="500"/>
</div>
