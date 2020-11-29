## CS492F Design Project Milestone 2: Prototype
### Team: Attention!
###### 20160171 Jinwoo Kim, 20160508 Jungwon Lee, 20150686 Seonghoon Jeong

### Project Summary
![eyecatcher](https://i.imgur.com/hENAd4y.png)
<div style="text-align:center">
<img src="https://i.imgur.com/s6Zf2T6.png" height="150"/>
</div>

A black-box inpainting AI can ignore user intention without explanation, harming the user experience. To solve the problem, we injected a backdoor to a trained black-box AI and connected it to an intuitive coloring UI. Our approach allows a joint understanding & control of the inpainting process, and is fully unsupervised, unlike most of the interactive AI.

### Instruction

Our framework supports three main types of interactions:
* AI-driven inpainting of an image's masked regions
* Visualization of AI decision via color-coded attention map
* Modulation of AI decision via painting UI

Link for prototype: http://143.248.133.65:4321/#.


<div style="text-align:center">
<img src="https://i.imgur.com/YRM1Y3H.png" width="400"/>
<img src="https://i.imgur.com/0pbDCKH.png" width="400"/>
</div>

In this section, we will further demonstrate how the upper image can be inpainted to produce the lower image.

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

### Implementation Details
[GitHub repository](https://github.com/bee6523/HAI_Flask)

Dependency:
`python` and `virtualenv` should suffice. Every required packages are listed in `engine/requirements.txt`, and can be installed by running `./install.sh`. After installation, activate the virtual environment in `engine/venv` by running `source ./activate.sh`.
An exhaustive listup:

`tensorflow==1.5.0`
`tensorflow-estimator==1.15.0`
`tensorflow-probability==0.11.0`
`matplotlib==3.3.1`
`scikit-build`
`opencv-python==4.4.0.42`
`pyyaml`
`git+git://github.com/JiahuiYu/neuralgym#egg=neuralgym`
`flask`

Web framework:
* [Flask](https://palletsprojects.com/p/flask/) (Web)
* [jQuery](https://jquery.com/)
* [Sammy.js](http://sammyjs.org/) (Router)
* [HTML5 Canvas](https://developer.mozilla.org/ko/docs/Web/HTML/Canvas)
* [Fontawesome](https://fontawesome.com/)

Model framework:
* [DeepFillv1](https://github.com/JiahuiYu/generative_inpainting/tree/v1.0.0): JiaHui et al., Generative Image Inpainting with Contextual Attention, CVPR (2018) [[arXiv]](https://arxiv.org/abs/1801.07892)
* [TenserFlow](https://www.tensorflow.org/?hl=ko)
* [Matplotlib](https://matplotlib.org/)
* [OpenCV](https://opencv.org/)
* [scikit-learn](https://scikit-learn.org/)
* [Jupyter](https://jupyter.org/)

### Individual Reflections

#### Jinwoo
I contributed to the AI-related parts of our system, which are:
* Inpainting API involving a pre-trained model and attention I/O via colormap.
* Backdoor routines that access the model's contextual attention layer.
* Conversion algorithms between RGB colormap and the full attention tensor.

#### 1. Fixing the deep computations

In the early trials, a main difficulty was that the injected attention often introduced artifacts in the inpainted boundary. I solved this problem by combining model attention with the injected attention and ensuring precise alignment between image, mask, and attention map after all image resizing operations. During the procedure, I learned following useful skills:
* I got familiar with TensorFlow (I am a PyTorch user).
* I got familiar to identifying problems of a deep CNN & debugging them.
* I realized the importance of pipeline components in AI-driven systems.

#### 2. Decoupling AI-UI development via unified representation

A characteristic of our development procedure was the decoupling of the UI and AI development. In addition to the role distinction, the decoupling was achieved by using the colored map as the unified representation shared between frontend and backend. As a result,
* I was able to focus on implementing and testing the backend inpainting API.
* The frontend side could assume the AI as an abstracted module and focus on enhancing user interactions with the colored map. Then, after the backend API was modularized, the web UI could simply import it and replace the dummy functions.
* The unified representation also helped in communication, by introducing a common 'language' between team members implementing different functions with different libraries.

#### 3. Comprehensive refinement of the integrated system

After the integration of frontend and backend, the development procedure was done iteratively. Based on mutual feedbacks, adding and removing UI components and enhancing the fidelity of the inpainting API were performed. At this stage, I could provide some more useful feedbacks about the UI, concerning the hidden behavior characteristics of attention-based deep models (e.g., maybe we should consider removing fill-in tools because it induces artifacts by globally changing the attention tensor).

#### Jungwon
I contributed to structuring & styling web interface and implementation & visualization of modulation tools.
* Page navigation (and corresponding display) using Sammy.js with progress bar (index.html, router.js, index.js)
* Step 3 user modulation tools (attention region selector, square and brush modulation tools)
* Display of right bottom colormap to visualize selected attentding region
* Layout and design, functionalizing and styling of buttons, progress bar, logo (index.css, Upload.css, processor.js)

First major difficulty we faced was on integration of machine-side python code and web-side javascript code, after each side built separately. We figured a way to bind, and found out Flask, a simple web framework based on python. Thankfully, Seonghoon took charge of creating flask app to bind the early codes.
Second difficulty was designing the way of user interaction in attention modulation stage. First, the color picker tool was pointwise and we mapped user's fill region and attending region in 1:1 scale.(i.e. user draws 10px square, then we fill it by drawing 10px square of colormap, centering from the attention point) There was a problem that user may not understand how the point they selected is used when they repaint the attention map.
I used mini-sized color map in right bottom side as a user guidance, displaying user's selection and box showing the region we used for each repaint, and providing small box of currently selected color. However, we again faced a problem that user has no direct control over attending region. If mask is big and user's intended attention region is small, we could fail to convey user's intention, by mapping mask's attention extended to unwanted region. So I changed selector tool from point-wise to region-wise, for better user understanding and control.
Since we were working on a novel project which is never similar to existing services, it was difficult to design user interaction method with sufficient intuitivity and understandability. Through active communication and supportive feedback between teammates, our team could successfully iterate on to improve the design. I learned how to collaborate well with clear role distribution and active communication to understand and help/give feedback on each's progress. For implementation side, I learned Flask, sammy JS, use of canvasAPI in html5, css techniques to align and style components. Also I earned design insights to give guidance, coherency and enough control to users, such as hiding components when unneeded to prevent confusion, or providing undo feature to fix mistakes user might make.

#### Seonghoon
I contributed in implementing modulation tool for user interaction. Specifically,
* Canvas structure to manage input image/attention/mask effectively
* Step 2 tools that creates mask image for inpainting.
* Step 3 initial tools that are now replaced by Jungwon's implementation
* Pipeline for sending user modulated attention to server and receiving result

 This was my first time implementing web application, so I had to learn how to use javascript/HTML/flask/etc. from the beginning. Jungwon has gave me a nice information about where to start in javascript and HTML.
 However, most difficult part for me was user-understandability. The initial step 3 tool I implemented was using mechanism of color picker tool and fill tool, that user can choose one point at a time, and 'filling' process is fully done by algorithm. It was sufficient for our team to observe behavior of model, but not intuitive enough for users to understand what is happening inside the system. Attending point did not properly reflect user's notion, leading to fail in modulating as intended. Fortunately, our team had strength in communication and discussion. Jungwon has came up with better idea, which gives attending 'area' rather then point, and re-implemented step 3 more intuitively.

While working on prototype, I learned following:
* Some Basic programming skills for javascript, HTML, and css.
* Way to construct web framework using flask
* Handling AJAX request to communicate from front-end to back-end.
* HTML canvas element and how to manage them.