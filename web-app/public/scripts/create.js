var apiUrl = location.protocol + '//' + location.host + "/api/";


$('#submit').click(function() {
    updateCreate();
});


function updateCreate(){
    var name = $("#name").val()
    var idnum = $("#idnum").val()
    var gender = $("#gender").val()
    var region = $("#region").val()
    var email = $("#email").val()
    var phone = $("#phone").val()
    var year = $("#year").val()
    var company = $("#company").val()
    var quota = $("#quota").val()
    var remark = $("#remark").val()
    paras = {
        "name":name,
        "idnum":idnum,
        "gender":gender,
        "region":region,
        "email":email,
        "phone":phone,
        "year":year,
        "company":company,
        "quota":quota,
        "remark":remark
    }
    console.log(paras);
    $.ajax({
        type: 'POST',
        async: true,
        timeout: 5000,
        url: apiUrl + 'create',
        data: JSON.stringify(paras),
        dataType: 'json',
        contentType: 'application/json',
        beforeSend: function() {

        },
        success: function(data) {
            if (data.error) {
                alert(data.error);
                return;
            } else {
                alert("A Successful Insurance !");
                window.location.href = "index.html";
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert("Error: Try again")
            console.log(errorThrown);
            console.log(textStatus);
            console.log(jqXHR);
        },
        complete: function() {
    
        }
        });
    return false;
}