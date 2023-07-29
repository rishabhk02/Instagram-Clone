// edit profile change photo js
document.addEventListener("DOMContentLoaded", function () {
    var fileInput = document.getElementById("profile-picture");
    var form = document.getElementById("profile-form");

    fileInput.addEventListener("change", function () {
        form.submit();
    });
});