var socket = io();
(function ($) {
    "use strict";


    /*==================================================================
    [ Validate ]*/
    var input = $('.validate-input .input100');

    $('.validate-form').on('submit', function (e) {
        var check = true;
        e.preventDefault()
        for (var i = 0; i < input.length; i++) {
            if (validate(input[i]) == false) {
                showValidate(input[i]);
                check = false;
            }
        }
        if (check) {
            console.log()
            socket.emit("login", $("#email").val(), $("#password").val(), document.getElementById("ckb1").checked)
        }
        return check
    });


    $('.validate-form .input100').each(function () {
        $(this).focus(function () {
            hideValidate(this);
        });
    });

    function validate(input) {
        if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        } else {
            if ($(input).val().trim() == '') {
                return false;
            }
        }
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }



})(jQuery);

socket.on("passwordCorrect", (username, key, rememberMe) => {
    if (rememberMe) {
        localStorage.setItem("username", username)
        localStorage.setItem("key", key)
        window.location.href="loggedIn.html"
    } else {
        sessionStorage.setItem("username", username)
        sessionStorage.setItem("key", key)
        window.location.href="loggedIn.html"
    }
})
socket.on("passwordWrong", () => {
    alert("username or password incorrect")
});
socket.on("allowed", () => {
    window.location.href="loggedIn.html"
});
(function(){
    console.log("execute")
    if(localStorage.getItem("username") && localStorage.getItem("key")){
        console.log("if")
        socket.emit("check", localStorage.getItem("username"), localStorage.getItem("key"))
    }
})()
