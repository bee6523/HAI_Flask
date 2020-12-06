var app = Sammy(function () {
    
    //라우트 설정****
    var beenhere = false;

    this.get("#/", function () {
        //인덱스 페이지
        $(".progress").hide();
        $("#mainDiv").load("/pages/Mainpage.html");
    });

    this.get("#/step1", function () {
        $("#stepInfo").text("Step 1: Upload your image.");
        $(".progress").show();
        if (!beenhere) $("#mainDiv").load("/pages/Upload.html");
        $("#canvas_layer").hide();
        $("#userUploadedImage").show();
        $("#prevBtn").hide();
        $("#toolBox").hide();
        beenhere = true;
    });
 
    this.get("#/step2", function () {
        startDrawing();
        $("#containconvert").hide();
        $("#originalBtn").addClass("hidden");
        $("#initialBtn").addClass("hidden");
        document.getElementById("originalBtn").disabled=true;
        document.getElementById("initialBtn").disabled=true;
        $("#canvas_layer").show();
        $("#userUploadedImage").hide();
        $("#stepInfo").text("Step 2: Mask your image.");
        $("#prevBtn").show();
        $("#toolBox").show();
        $("#toolBox").load("./pages/Step2Components.html");
    });

    this.get("#/step3", function () {
        $("#containconvert").show();
        $("#originalBtn").removeClass("hidden");
        $("#initialBtn").removeClass("hidden");
        document.getElementById("convertBtn").disabled=true;
        startAttending();
        $("#stepInfo").text("Step 3: See initial inpainting result.\n If you want to modify the result, click modulate button.");
        $("#nextBtn").show();
        $("#prevBtn").show();
        $("#toolBox").load("./pages/Step3Components.html");
        $("#comparediv").width(img_width+100);
    });

    this.get("#/step4", function () {
        //do display
        $("#stepInfo").text("Step 4: Download your result!");
        $("#modulate-tooltip").hide();
        $('#result_layer').css("visibility","visible");
        $("#toolBox").load("./pages/Step4Components.html");
        $("#nextBtn").hide();
        $("#prevBtn").hide();
        $("#containconvert").hide();
        $("#comparediv").width(img_width+300);
    });

    this.get("#/param/:id", function () {
        //파라미터 받기
        var nID = this.params['id'];
 
        $("#mainDiv").html("넘어온 파라미터 id : " + nID);
    });
 
});
 
//어플리케이션 시작
$(function () {
    app.run('#/');
});