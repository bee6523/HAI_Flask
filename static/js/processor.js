var image_file, image, colorMap, loadImage,
  img_width,img_height,
  img_layer, img_ctx,
  cnv_layer, cnv_ctx,
  att_layer, att_ctx,
  tmp_layer,tmp_ctx,
  result_layer, result_ctx,
  prevX,prevY,
  currX,currY,
  attendlX,attendlY,
  attendrX,attendrY,
  lineLx, lineLy,
  lineHx, lineHy,
  att_img, init_image, result_image;
var showingResult=true; //true if displaying result, false if modulating phase
var mask, attention;
var tool="rect";
var lineWidth=5;
var sizeChecked=false;
var draw_flag=false;
var change_flag=true;
var maskUndoList=[];
var attUndoList=[];

///Triggered when processor.js is loaded
let processor = {
    doLoad: function() {
      img_layer = document.getElementById("img_layer");
      cnv_layer = document.getElementById("canvas_layer");
      tmp_layer=document.getElementById("tmp_layer");
      att_layer=document.getElementById("att_layer");
      result_layer=document.getElementById("result_layer");
      img_ctx = img_layer.getContext("2d");
      cnv_ctx = cnv_layer.getContext("2d");
      tmp_ctx=tmp_layer.getContext("2d");
      att_ctx=att_layer.getContext("2d");
      result_ctx=result_layer.getContext("2d");
      colorMap = new Image();
      colorMap.src="/static/img/colorpalette.png";
      loadImage = new Image();
      loadImage.src="/static/img/loading.png";
      this.elImage = document.getElementById("userUploadedImage");

      this.elImage.addEventListener("change", (evt)=>{
          image_file = evt.target.files[0];
          image = new Image();
          image.addEventListener("load",(evt)=>{
            ratio=image.height/image.width;
            if(ratio>(400/560)){
              img_width=parseInt(400/ratio);
              img_height=400;
            }
            else{
              img_width=560;
              img_height=parseInt(560*ratio);
            }
            img_layer.width=cnv_layer.width=att_layer.width=tmp_layer.width=result_layer.width=parseInt(img_width/8)*8;
            img_layer.height=cnv_layer.height=att_layer.height=tmp_layer.height=result_layer.height=parseInt(img_height/8)*8;
            img_ctx.drawImage(image,0,0,img_width,img_height);
            img_width = parseInt(img_width/8)*8;
            img_height = parseInt(img_height/8)*8;
            $("#canvasDiv").width(img_width+100);
            $("#canvasDiv").height(img_height+20);
            $("#comparediv").width(img_width+100);
            cnv_ctx.clearRect(0,0,img_width,img_height);
            att_ctx.clearRect(0,0,img_width,img_height);
          });
          image.src=window.URL.createObjectURL(image_file);
          $('#nextBtn').show();
      })
    },
  };

/// Step 2 Configuration
function startDrawing(){
  document.getElementById("result_layer").style.visibility="hidden";
  att_layer.style.visibility="hidden";
  tmp_ctx.clearRect(0,0,img_width,img_height);
  //att_ctx.clearRect(0,0,img_width,img_height);
  window.addEventListener("mousemove",doDraw);
  tmp_layer.addEventListener("mousedown",initDraw);
  window.addEventListener("mouseup",endDraw);
  tool="rect";
}

/// Step 3 configuration, send AJAX request to model for initial result
function startAttending(){
  att_layer.style.visibility="visible";
  if(change_flag == false){
    document.getElementById("convertBtn").disabled=false;
    document.getElementById("originalBtn").disabled=false;
    document.getElementById("initialBtn").disabled=false;
    document.getElementById("result_layer").style.visibility="visible";
    $('#convertBtn').html("Modulate");
    showingResult=true;
    return;
  }else{
    att_ctx.clearRect(0,0,img_width,img_height);
  }

  document.getElementById("result_layer").style.visibility="visible";
  result_ctx.clearRect(0,0,img_width,img_height);
  result_ctx.drawImage(loadImage,img_width/2-50,img_height/2-50,100,100);

  document.getElementById("convertBtn").disabled=true;
  
  mask=convertToMask();
  formData = new FormData();
  formData.append("img",img_layer.toDataURL("image/png"));
  formData.append("mask",mask);
  $.ajax({
      type: "POST",
      url: "/InitResult",
      data: formData,
      contentType: false,
      processData: false,
      cache: false,
      async: true,
      success: callback_getAttention
  });
  console.log("sent initial mask");
  tool="null";
}

///Send AJAX request to model(for step3)
function showResult(){
  $("#modulate-tooltip").hide();
  if(showingResult){
    document.getElementById("result_layer").style.visibility="hidden";
    $('#convertBtn').html("Convert");
    $('#attendingGadgets').show();
    $('#mapContainer').show();
    $("#comparediv").width(img_width+100+$("#attendingGadgets").width());
    pickicker();
    showingResult=false;
  }else{
    if(change_flag == false){
      document.getElementById("result_layer").style.visibility="visible";
      $('#convertBtn').html("Modulate");
      document.getElementById("convertBtn").disabled=false;
      $('#attendingGadgets').hide();
      $('#mapContainer').hide();
      $("#comparediv").width(img_width+100);
      showingResult=true;
      return;
    }

    console.log(image.src);

    //show loading image while processing
    document.getElementById("result_layer").style.visibility="visible";
    result_ctx.clearRect(0,0,img_width,img_height);
    result_ctx.drawImage(loadImage,img_width/2-50,img_height/2-50,100,100);

    document.getElementById("convertBtn").disabled=true;
    document.getElementById("originalBtn").disabled=true;
    document.getElementById("initialBtn").disabled=true;
    $('#attendingGadgets').hide();
    $('#mapContainer').hide();

    mask=convertToMask();
    attention=convertToAttImage();
    formData = new FormData();
    formData.append("img",img_layer.toDataURL("image/png"));
    formData.append("mask",mask);
    formData.append("att",attention);
    $.ajax({
        type: "POST",
        url: "/Result",
        data: formData,
        contentType: false,
        processData: false,
        cache: false,
        async: true,
        success: callback_getResult
    });
    console.log("send!!");
  }
}

///Callback function that is triggered when backend model created output&attention image at step2->step3 process
function callback_getAttention(response){
  console.log("success!")
  console.log(response);
  att_img=new Image();
  init_image= new Image();
  init_image.addEventListener("load",(evt)=>{
    result_ctx.drawImage(init_image,0,0,img_width,img_height);
    change_flag=false;
    attUndoList=[];
    $('#convertBtn').html("Modulate");
    document.getElementById("convertBtn").disabled=false;
    document.getElementById("originalBtn").disabled=false;
  });
  att_img.addEventListener("load",(evt)=>{
    console.log("Attention image loaded");
    att_ctx.drawImage(cnv_layer,0,0,img_width,img_height);
    att_ctx.globalCompositeOperation="source-in";
    att_ctx.drawImage(att_img,0,0,img_width,img_height);
    att_ctx.globalCompositeOperation="source-over";
  });
  paths=response.split('&');
  init_image.src=paths[0]+ "?t=" + new Date().getTime();
  att_img.src=paths[1]+ "?t="+ new Date().getTime();
}

///Callback function that is triggered when backend model created output image at step3 convert
function callback_getResult(response){
  console.log(response);
  result_image = new Image();
  result_image.addEventListener("load",(evt)=>{
    showingResult=true;
    change_flag=false;
    result_ctx.drawImage(result_image,0,0,img_width,img_height);
    $('#convertBtn').html("Modulate");
    document.getElementById("convertBtn").disabled=false;
    document.getElementById("originalBtn").disabled=false;
    document.getElementById("initialBtn").disabled=false;
  });
  result_image.src=response + "?t=" + new Date().getTime();
}


/// Pre-process function for sending mask image to backend model
function convertToMask(){
  var canvas=document.createElement("canvas");
  var ctx=canvas.getContext("2d");
  canvas.width=img_width;
  canvas.height=img_height;
  ctx.fillStyle="black";
  ctx.fillRect(0,0,img_width,img_height);
  ctx.drawImage(cnv_layer,0,0);

  return canvas.toDataURL("image/png");
}
/// Pre-process function for sending Attention image to backend model
function convertToAttImage(){
  var canvas=document.createElement("canvas");
  var ctx=canvas.getContext("2d");
  canvas.width=img_width;
  canvas.height=img_height;
  ctx.fillStyle="white";
  ctx.fillRect(0,0,img_width,img_height);
  ctx.drawImage(att_layer,0,0);

  return canvas.toDataURL("image/png");
}

/* mouseDown event handler */
function initDraw(e){
  switch(tool){
    case "brush_3":
      draw_flag=true;
      currX = e.layerX;
      currY = e.layerY;
      prevX=currX;
      prevY=currY;
      lineLx=currX;
      lineLy=currY;
      lineHx=currX;
      lineHy=currY;
      break;
    case "rect":
    case "rect_3":
    case "eraser":
    case "eraser_3":
      draw_flag=true;
      currX = parseInt(e.layerX/8)*8;
      currY = parseInt(e.layerY/8)*8;
      prevX=currX;
      prevY=currY;
      break;
    default:
      draw_flag=true;
      currX = e.layerX;
      currY = e.layerY;
      prevX=currX;
      prevY=currY;
  }
}

/// MouseMove event handler
function doDraw(e){
  var mainDiv=document.getElementById("mainDiv");
  let cx=e.pageX-mainDiv.offsetLeft;
  let cy=e.pageY-mainDiv.offsetTop;
  //console.log(cx,e.screenX,mainDiv.offsetLeft);
  if(draw_flag){
    if(cx>=img_width) cx=img_width;
    else if(cx<0) cx=0;
    if(cy>=img_height) cy=img_height;
    else if(cy<0) cy=0;
    switch(tool){
      case "brush":
        prevX = currX;
        prevY = currY;
        currX = cx;
        currY = cy;
        tmp_ctx.beginPath();
        tmp_ctx.moveTo(prevX, prevY);
        tmp_ctx.lineTo(currX, currY);
        tmp_ctx.strokeStyle = "white";
        tmp_ctx.lineWidth = lineWidth;
        tmp_ctx.lineCap = "round";
        tmp_ctx.stroke();
        tmp_ctx.closePath();
        break;
      case "rect":
        tmp_ctx.clearRect(prevX,prevY,currX-prevX,currY-prevY);
        currX=parseInt(cx/8)*8;
        currY=parseInt(cy/8)*8;
        tmp_ctx.fillStyle="white";
        tmp_ctx.fillRect(prevX,prevY,currX-prevX,currY-prevY);
        break;
      case "eraser":
        tmp_ctx.clearRect(prevX,prevY,currX-prevX,currY-prevY);
        currX=parseInt(cx/8)*8;
        currY=parseInt(cy/8)*8;
        tmp_ctx.drawImage(img_layer,prevX,prevY,currX-prevX,currY-prevY,prevX,prevY,currX-prevX,currY-prevY);
        break;
      case "picker":
        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        currX=cx;
        currY=cy;
        tmp_ctx.lineWidth=1;
        tmp_ctx.strokeStyle="black";
        tmp_ctx.setLineDash([4, 4]);
        tmp_ctx.strokeRect(prevX,prevY,currX-prevX,currY-prevY);
        /* display attention region in colormap element */
        marker_layer=document.getElementById("marker_layer");
        sm_ctx = marker_layer.getContext("2d");
        sm_ctx.clearRect(0,0,marker_layer.width,marker_layer.height);
        sm_ctx.strokeStyle="red";
        sm_ctx.strokeRect(prevX/3,prevY/3,(currX-prevX)/3,(currY-prevY)/3);
        break;
      case "rect_3":
        color_layer=document.getElementById("color_layer");
        box_ctx = color_layer.getContext("2d");
        pixData = box_ctx.getImageData(10,10,1,1);
        [r, g, b, a] = pixData.data;
        if ([r,g,b,a]!=[0,0,0,0]) {
          tmp_ctx.clearRect(prevX,prevY,currX-prevX,currY-prevY);
          currX=parseInt(cx/8)*8;
          currY=parseInt(cy/8)*8;
          tmp_ctx.fillStyle=`rgba(${r},${g},${b},${a/255})`;
          tmp_ctx.fillRect(prevX,prevY,currX-prevX,currY-prevY);
        }
        break;
      case "brush_3":
        color_layer=document.getElementById("color_layer");
        box_ctx = color_layer.getContext("2d");
        pixData = box_ctx.getImageData(10,10,1,1);
        [r, g, b, a] = pixData.data;
        if ([r,g,b,a]!=[0,0,0,0]) {
          if (currX<lineLx) lineLx = currX;
          if (currX>lineHx) lineHx = currX;
          if (currY<lineLy) lineLy = currY;
          if (currY>lineHy) lineHy = currY;
          prevX = currX;
          prevY = currY;
          currX = cx;
          currY = cy;
          tmp_ctx.beginPath();
          tmp_ctx.moveTo(prevX, prevY);
          tmp_ctx.lineTo(currX, currY);
          tmp_ctx.strokeStyle =`rgba(${r},${g},${b},${a/255})`;
          tmp_ctx.lineWidth = lineWidth;
          tmp_ctx.lineCap = "round";
          tmp_ctx.stroke();
          tmp_ctx.closePath();
        }
        break;
      case "eraser_3":
        tmp_ctx.clearRect(prevX,prevY,currX-prevX,currY-prevY);
        tmp_ctx.drawImage(att_layer,0,0);
        currX=parseInt(cx/8)*8;
        currY=parseInt(cy/8)*8;
        tmp_ctx.globalCompositeOperation = "source-atop";
        tmp_ctx.drawImage(att_img,prevX,prevY,currX-prevX,currY-prevY,prevX,prevY,currX-prevX,currY-prevY);
        tmp_ctx.globalCompositeOperation = "source-over";
        break;
    }
  }else{
    [r,g,b,a]=[255,255,255,255];
    switch(tool){
      case "brush_3":
        pixData = box_ctx.getImageData(10,10,1,1);
        [r, g, b, a] = pixData.data;
        if ([r,g,b,a]==[0,0,0,0]) 
          break;
      case "brush":
        tmp_ctx.fillStyle =`rgba(${r},${g},${b},${a/255})`;
        tmp_ctx.clearRect(currX-lineWidth/2-1,currY-lineWidth/2-1,lineWidth+2,lineWidth+2);
        currX=cx;
        currY=cy;
        tmp_ctx.lineWidth=lineWidth;
        tmp_ctx.lineCap="round";
        tmp_ctx.beginPath();
        tmp_ctx.arc(currX,currY,lineWidth/2,0,2*Math.PI);
        tmp_ctx.fill();
        tmp_ctx.closePath();
        break;
    }
  }
}

/// MouseUp event handler
function endDraw(e){
  if(draw_flag){
    draw_flag=false;
    switch(tool){
      case "picker":
        attendlX=prevX;
        attendlY=prevY;
        attendrX=currX;
        attendrY=currY;
        /* display color preview in colormap element */
        color_layer=document.getElementById("color_layer");
        box_ctx = color_layer.getContext("2d");
        box_ctx.clearRect(0,0,color_layer.width,color_layer.height);
        hratio = colorMap.height/tmp_layer.height;
        wratio = colorMap.width/tmp_layer.width;
        box_ctx.drawImage(colorMap,(prevX+currX)/2*wratio-5, (prevY+currY)/2*hratio-5, 10, 10, 0, 0, color_layer.width, color_layer.height);
        break;
      case "eraser":
        maskUndoList.push(cnv_ctx.getImageData(0,0,img_width,img_height));
        cnv_ctx.clearRect(prevX,prevY,currX-prevX,currY-prevY);
        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        change_flag=true;
        break;
      case "rect_3":
        attUndoList.push(att_ctx.getImageData(0,0,img_width,img_height));

        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        recWidth = currX-prevX;
        recHeight = currY-prevY;
        hratio = colorMap.height/tmp_layer.height;
        wratio = colorMap.width/tmp_layer.width;
        att_ctx.globalCompositeOperation = "source-atop";
        att_ctx.drawImage(colorMap,attendlX*wratio,attendlY*hratio,(attendrX-attendlX)*wratio,(attendrY-attendlY)*hratio,prevX,prevY,recWidth,recHeight);
        att_ctx.globalCompositeOperation = "source-over";

        change_flag=true;
        break;
      case "brush_3":
        attUndoList.push(att_ctx.getImageData(0,0,img_width,img_height));

        pathWidth = lineHx-lineLx+2*lineWidth;
        pathHeight = lineHy-lineLy+2*lineWidth;
        hratio = colorMap.height/tmp_layer.height;
        wratio = colorMap.width/tmp_layer.width;
        tmp_ctx.globalCompositeOperation = "source-in";
        tmp_ctx.drawImage(colorMap,attendlX*wratio,attendlY*hratio,(attendrX-attendlX)*wratio,(attendrY-attendlY)*hratio,lineLx-lineWidth,lineLy-lineWidth,pathWidth,pathHeight);
        tmp_ctx.globalCompositeOperation = "source-over";
        att_ctx.globalCompositeOperation = "source-atop";
        att_ctx.drawImage(tmp_layer,0,0);
        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        att_ctx.globalCompositeOperation = "source-over";
        
        change_flag=true;
        break;
      case "eraser_3":
        attUndoList.push(att_ctx.getImageData(0,0,img_width,img_height));
        att_ctx.drawImage(tmp_layer,0,0);
        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        change_flag=true;
        break;
      default:
        maskUndoList.push(cnv_ctx.getImageData(0,0,img_width,img_height));
        cnv_ctx.drawImage(tmp_layer,0,0);
        tmp_ctx.clearRect(0,0,tmp_layer.width,tmp_layer.height);
        change_flag=true;
    }
  }
}


///Function for Step 2 tool transition
function recrec() {
  tool="rect";
  document.getElementById("brushBtn").disabled=false;
  document.getElementById("rectBtn").disabled=true;  
  document.getElementById("eraseBtn").disabled=false;
}
function brusrush(n) {
  tool="brush";
  if (n==="i") {
    if (!sizeChecked) {
      lineWidth=20;
    }
  }
  else {
    lineWidth=n;
    sizeChecked=true;
  }
  document.getElementById("rectBtn").disabled=false;
  document.getElementById("brushBtn").disabled=true;
  document.getElementById("eraseBtn").disabled=false;
}
function erasrase() {
  tool="eraser";
  document.getElementById("rectBtn").disabled=false;
  document.getElementById("brushBtn").disabled=false;
  document.getElementById("eraseBtn").disabled=true;
}
function undodo(){
  if(maskUndoList.length>0){
    cnv_ctx.putImageData(maskUndoList.pop(),0,0);
    change_flag=true;
  }
}

/// function for step3 tool transition
function pickicker() {
  tool="picker";
  document.getElementById("pickerBtn").disabled=true;
  document.getElementById("rect3Btn").disabled=false;
  document.getElementById("brush3Btn").disabled=false;
  document.getElementById("eraser3Btn").disabled=false;
}
function rectect() {
  tool="rect_3";
  document.getElementById("pickerBtn").disabled=false;
  document.getElementById("rect3Btn").disabled=true;
  document.getElementById("brush3Btn").disabled=false;
  document.getElementById("eraser3Btn").disabled=false;
}
function brusrush_3(n) {
  tool="brush_3";
  if (n==="i") {
    if (!sizeChecked) {
      lineWidth=20;
    }
  }
  else {
    lineWidth=n;
    sizeChecked=true;
  }
  document.getElementById("pickerBtn").disabled=false;
  document.getElementById("rect3Btn").disabled=false;
  document.getElementById("brush3Btn").disabled=true;
  document.getElementById("eraser3Btn").disabled=false;
}
function erasrase_3() {
  tool="eraser_3";
  document.getElementById("pickerBtn").disabled=false;
  document.getElementById("rect3Btn").disabled=false;
  document.getElementById("brush3Btn").disabled=false;
  document.getElementById("eraser3Btn").disabled=true;
}
function undodo_3(){
  if(attUndoList.length>0){
    att_ctx.putImageData(attUndoList.pop(),0,0);
    change_flag=true;
  }
}

function showOriginalImage(){
  document.getElementById("img_layer").style.zIndex=10;
}
function hideOriginalImage(){
  document.getElementById("img_layer").style.zIndex=0;
}
function showInitialImage(){
  document.getElementById("result_layer").style.visibility="visible";
  result_ctx.drawImage(init_image,0,0,img_width,img_height);
}
function hideInitialImage(){
  if(!showingResult)
    document.getElementById("result_layer").style.visibility="hidden";
  result_ctx.drawImage(result_image,0,0,img_width,img_height);
}

function palettesize() {
  var palette_width=img_width/3;
  var palette_height=img_height/3;
  pal_layer=document.getElementById("colorpalette");
  mark_layer=document.getElementById("marker_layer");
  reg_layer=document.getElementById("region_layer");
  pal_ctx = pal_layer.getContext("2d");
  reg_layer.width=mark_layer.width=pal_layer.width=palette_width;
  reg_layer.height=mark_layer.height=pal_layer.height=palette_height;
  pal_layer.style.visibility="visible";
  pal_ctx.clearRect(0,0,palette_width,palette_height);
  pal_ctx.drawImage(colorMap,0,0,palette_width,palette_height);
  reg_ctx = reg_layer.getContext("2d");
  reg_ctx.drawImage(cnv_layer,0,0,palette_width,palette_height);
}

function downloadResultImage(el){
  el.href=result_layer.toDataURL("image/png");
  el.download = "result.png";
}

//어플리케이션 시작
$(function () {
  processor.doLoad();
});