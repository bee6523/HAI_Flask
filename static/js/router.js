var app = Sammy(function () {
    
    //라우트 설정****
 
    this.get("#/", function () {
        //인덱스 페이지
        $("#mainDiv").load("/pages/Upload.html");
    });
 
    this.get("#/step2", function () {
        startDrawing();
        $("#userUploadedImage").hide();
        $("#prevBtn").show();
        $("#toolBox").load("./pages/Step2Components.html");
    });

    this.get("#/step3", function () {
        startAttending();
        $("#step2Components").hide();
        $("#toolBox").load("./pages/Step3Components.html");
    });

    this.get("#/step4", function () {
        startAttending();
        $("#mainDiv").load("/AttendResult");
    });


    this.get("#/param/:id", function () {
        //파라미터 받기
        var nID = this.params['id'];
 
        $("#mainDiv").html("넘어온 파라미터 id : " + nID);
    });
 
    //404
    this.notFound = function (verb, path) {
        //인덱스 페이지
        //$("#mainDiv").load("/pages/index.html");
        $("#mainDiv").html("404, 페이지 못찾음");
    };
});
 
//어플리케이션 시작
$(function () {
    app.run('#/')
});