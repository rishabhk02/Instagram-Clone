let admin = document.getElementById('adminDetail').value;
admin = JSON.parse(admin);


// ADD POST SECTION 
let addpostMarkup = `
        <i class="fa-solid fa-xmark" id="pop_up_section_close"></i>
        <div class="add_post_inner">
            <div class="add_post_header">
                <i class="fa-solid fa-arrow-left"></i>
                <p>Create New Post</p>
                <p id="share_post_btn">Share</p>
            </div>
            <div class="add_post_content">
                <form action="/addPost" method="post" enctype="multipart/form-data" id="share_post_form">
                    <div class="add_post_left">
                        <div class="add_post_select_img" id="imageSelect">
                            <p>Select Photo</p>
                            <input type="file" id="imageInput" name='image'>
                        </div>
                        <img id="imagePreview" src="" alt="">
                    </div>
                    <div class="add_post_right">
                        <div class="add_post_author_detail">
                            <img src="/Images/${admin.profileImage}" alt="">
                            <p>${admin.userName}</p>
                        </div>
                        <div class="add_post_caption">
                            <textarea id="bio" name="caption" placeholder="Add a caption..."></textarea>
                        </div>
                    </div>
                </form>
            </div>
        </div>
`;

document.addEventListener('click', function (event) {
    if (event.target.id === 'open_post_popup') {
        let popUp = document.querySelector(".pop_up_section");
        popUp.style.display = 'flex';
        popUp.innerHTML = addpostMarkup;

        // loading the image on selection of image for post
        const imageInput = document.getElementById('imageInput');
        const imagePreview = document.getElementById('imagePreview');

        imageInput.addEventListener('change', function (event) {
            document.getElementById('imageSelect').style.display = 'none';
            const file = event.target.files[0];
            if (file) {
                imagePreview.style.display = 'block';

                const reader = new FileReader();

                reader.addEventListener('load', function () {
                    // Set the image source to the data URL
                    imagePreview.src = reader.result;
                });

                // Read the image file as a data URL
                reader.readAsDataURL(file);
            } else {
                // Reset the image preview if no file is selected
                imagePreview.src = '';
            }
        });


        const form = document.getElementById('share_post_form');

        // Get the submit button
        const submitButton = document.getElementById('share_post_btn');

        // Add click event listener to the button
        submitButton.addEventListener('click', function () {
            // Submit the form
            form.submit();
        });

    }
});


// VIEW COMMENT SECTION 
document.addEventListener('click', function (event) {
    if (event.target.id === 'viewcomment') {
        let popUp = document.querySelector(".pop_up_section");
        popUp.style.display = 'flex';

        let postDetail = JSON.parse(event.target.closest('.single_post').querySelector('#postDetail').value);

        axios.get(`/getComments/${postDetail._id}`).then(response => {
            let commentData = response.data.commentData;
            commentData = commentData[0];

            let markup = generateCommentMarkup(commentData);
            popUp.innerHTML = markup;
            commentFunction(postDetail);

        }).catch(error => {
            // Handle any errors that occurred during the request
            console.error(error);
        });
    }
});

function generateCommentMarkup(commentData) {
    let markup = `
    <i class="fa-solid fa-xmark" id="pop_up_section_close"></i>
    <div class="comment_section_inner">
        <div class="comment_section_left_side">
            <img src="/Images/${commentData.postContent.data}" alt="">
        </div>
        <div class="comment_section_right_side  forReplyFocus">
            <div class="header">
                <div>
                    <img src="/Images/${commentData.author.profileImage}" alt="">
                    <div class="name_userName">
                        <p>${commentData.author.userName}</p>
                        <p>${commentData.author.name}</p>
                    </div>
                </div>
                <i class="fa-solid fa-ellipsis"></i>
            </div>

            <div class="content comment_${commentData._id}_section">`;

    commentData.comments.forEach(comment => {
        markup += `
                <div class="comment_row_outer comment_${comment._id}_dlt">
                    <div class='cmnt_row_inner'>
                        <div> <img src="/Images/${comment.author.profileImage}" alt=""> </div>
                        <div class="comment_detail">
                            <p>${comment.author.userName} &nbsp; &nbsp;<span>${comment.content}</span></p> 
                            <input type='hidden' value='${JSON.stringify(comment)}'>                           
                            <p><span id='replyBtn'>Reply</span> <i class="fa-solid fa-ellipsis" id='dltCmntpopup'></i></p>
                        </div>
                    </div>`
                    if(comment.replies.length>0){
                    markup+=`<div class='showreplybtn' id='showreplybtn'>View all replies</div>`}      
                    markup+=`<div class='cmnt_rply_outer com_${comment._id}_reply' id='cmnt_rply_outer'>`
        comment.replies.forEach(reply => {
            markup += `
                            <div class='cmnt_reply_row'>
                                <div> <img src="/Images/${reply.author.profileImage}" alt=""></div>
                                <div class="cmnt_reply_detail">
                                    <p>${reply.author.userName} &nbsp; &nbsp;<span>${reply.content}</span></p> 
                                    <input type='hidden' value='${JSON.stringify(reply)}'>                           
                                    <p><span id='replyBtn'>Reply</span> <i class="fa-solid fa-ellipsis" id='dltCmntpopup'></i></p>
                                </div>
                            </div>
                        `
        })
        markup += `</div>
                </div>
        `
    });

    markup += `
            </div>
            <div class="footer add_comment">
                <form action="" id="post_comment_form">
                <div class="add_comment_left_side">
                    <i class="fa-regular fa-face-smile"></i>
                    <input type="text" placeholder="Add a comment....." name="inputComment" autocomplete="off">
                </div>
                <div class="add_comment_right_side">
                    <input type="hidden" id="postComment" name="postId" value="${commentData._id}">                
                    <p id="post_comment_btn">Post</p>
                </div>
                </form>
            </div>
        </div>
    </div>`;

    return markup;
}

function commentFunction(postDetail) {
    document.addEventListener('click', function (event) {
        if (event.target.id == 'dltCmntpopup') {
            const commentRow = event.target.closest('.cmnt_row_inner');
            let commentDetail = JSON.parse(commentRow.querySelector('input[type="hidden"]').value);
            // console.log(commentDetail);
            let extraPopup = document.querySelector('.extra_pop_up_section');
            extraPopup.style.display = 'flex';
            let cmntmarkup = `
            <div class='dltCmnt_popup_inner'>`;
            if (commentDetail.author._id === admin._id) {
                cmntmarkup += `<p style='color:red' id='dltcmntbtn' data-cmntid='${commentDetail._id}'>Delete</p>`;
            }
            cmntmarkup += `              
            <p id='close_extra_popup'>Cancel</p>
            </div>
            `;
            extraPopup.innerHTML = cmntmarkup;
        }
    });

    // Closing extra popup
    document.addEventListener('click', function (event) {
        if (event.target.id === 'close_extra_popup') {
            document.querySelector('.extra_pop_up_section').style.display = 'none';
        }
    });

    // Delete Comment JS
    document.addEventListener('click', function (event) {
        if (event.target.id == 'dltcmntbtn') {
            let cmntId = event.target.dataset.cmntid;
            axios.post(`/removeComment/${postDetail._id}`, { cmntId: cmntId}, { headers: { 'Content-Type': 'application/json' } }).then(res => {
                document.querySelector('.extra_pop_up_section').style.display = 'none';
            });
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.id == 'replyBtn') {
            const commentRow = event.target.closest('.cmnt_row_inner');
            let commentDetail = JSON.parse(commentRow.querySelector('input[type="hidden"]').value);
            let cmntInput = event.target.closest('.forReplyFocus').querySelector(`input[type='text']`);
            cmntInput.value = '@' + commentDetail.author.userName;
            cmntInput.focus();

            cmntInput.addEventListener('keyup', function () {
                if (cmntInput.value.includes('@' + commentDetail.author.userName)) {
                    cmntInput.setAttribute('data-cmntid', commentDetail._id);
                    cmntInput.setAttribute('data-pstid', postDetail._id);
                } else {
                    cmntInput.removeAttribute('data-cmntid');
                    cmntInput.removeAttribute('data-pstid');
                }
            });
        }
    })

    // showing hiding comment reply
    document.addEventListener('click', function (event) {
        if (event.target.id === 'showreplybtn') {
            if (event.target.innerText == "View all replies") {
                event.target.innerText = "Hide replies";
                event.target.closest('.comment_row_outer').querySelector('#cmnt_rply_outer').style.display = 'flex';
            } else {
                event.target.innerText = "View all replies";
                event.target.closest('.comment_row_outer').querySelector('#cmnt_rply_outer').style.display = 'none';
            }
        }
    })
}


// Post Lik-Unlike JS
document.addEventListener('click', function (event) {
    if (event.target.id === 'post_like_btn') {
        // let postDetail = JSON.parse(event.target.closest('.single_post').querySelector('#postDetail').value);
        let postDetail = JSON.parse(event.target.dataset.post);
        axios.post(`/likePost/${postDetail._id}`, { content: '' }, { headers: { 'Content-Type': 'application/json' } });
    }
});


// Post Save-Unsave JS
document.addEventListener('click', function (event) {
    if (event.target.id === 'save_btn') {
        let postDetail = JSON.parse(event.target.dataset.post);
        axios.post(`/savePost/${postDetail._id}`, { content: '' }, { headers: { 'Content-Type': 'application/json' } });
    }
})

// Comment Post JS
document.addEventListener('click', function (event) {
    if (event.target.id === "post_comment_btn") {
        event.preventDefault();
        const form = event.target.closest('form');

        // Get the form data
        const formData = new FormData(form);

        // Create an object to store the form data
        const data = {};

        // Iterate over the form data and store it in the object
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        if(data.inputComment.length==0){
            form.reset();
            return;
        }

        // Adding reply to the comment 
        if (form.querySelector('input[type="text"]').hasAttribute('data-cmntid')) {
            let reply = data.inputComment.split(' ').slice(1).join(' ');
            let postId = data.postId;
            let commentId = form.querySelector('input[type="text"]').dataset.cmntid;
            axios.post(`/addReply/${postId}`, { commentId: commentId, content: reply }, { headers: { 'Content-Type': 'application/json' } });
            form.reset();
            return;
        }


        let commentInput = data.inputComment;
        let postId = data.postId;

        axios.post(`/addcomment/${postId}`, { content: commentInput }, { headers: { 'Content-Type': 'application/json' } });

        form.reset();
    }
});

// Clossing Pop-UP JS
document.addEventListener('click', function (event) {
    if (event.target.id === 'pop_up_section_close') {
        document.querySelector('.pop_up_section').style.display = 'none';
    }
});

// Log-Out JS
document.getElementById('log_out').addEventListener('click', function () {
    axios.post('/logout').then(response=>{
        location.reload();
    }).catch(err=>{
        console.log(err);
    })
});



// Search Section JS
function searchJS() {
    let searchMarkup = `
        <div class="middle_section_heading">Search</div>
        <div class="search_input">
            <div class="home_search_box">
                <i class="fa-sharp fa-solid fa-magnifying-glass"></i>
                <input type="search" placeholder="Search" id="search_user_input">
            </div>
        </div>
        <div class='clearAll'><p>Recent</p><p id='clearBtn'>Clear All</p></div>
        <div class="searched_users" id="searched_users">


        </div>`;

    // Adding Past-Recent Search
    document.addEventListener('click', function (event) {
        if (event.target.id === 'open_search_section') {
            let sidebar = document.querySelector(".sidebar");
            let middleSection = document.querySelector(".middle_section");

            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
            middleSection.classList.add('open');
            middleSection.innerHTML = searchMarkup;

            axios.get('/prevSearchedUsers').then(response => {
                let recentSearchData = response.data.recentSearchData;
                document.getElementById('searched_users').innerHTML = generateSearchDefault(recentSearchData);
            });
        }
    });

    function generateSearchDefault(recentSearchData) {
        let markup = '';
        recentSearchData.forEach(data => {
            markup += `
        <div class="searched_user_row" id="search_${data.userData._id}_us">
        <a href='/user/${data.userData.userName}' class='recentSearch'>
            <input type='hidden' value="${data.userData._id}">
            <img src="/Images/${data.userData.profileImage}" alt="">
            <div class="searched_user_detail">
                <p>${data.userData.userName}</p>
                <p>${data.userData.name}</p>
            </div>
        </a>
        <i class="fa-solid fa-xmark" id='dltrcntsrch' data-recentuserid='${data.userData._id}'></i>
        </div>`
        });

        return markup;
    }


    // Live Searching User
    document.addEventListener('keyup', function (event) {
        if (event.target.id === 'search_user_input') {
            let inputvalue = event.target.value.trim();
            if (inputvalue.length === 0) {
                axios.get('/prevSearchedUsers').then(response => {
                    let recentSearchData = response.data.recentSearchData;
                    document.getElementById('searched_users').innerHTML = generateSearchDefault(recentSearchData);
                });
                return;
            }
            axios.post('/getAllUsers', { data: inputvalue }).then(response => {
                let userData = response.data.userData;
                userData = userData.slice(0, 10);
                let markup = generateSearchMarkup(userData);
                document.getElementById('searched_users').innerHTML = markup;
            });
        }
    });

    function generateSearchMarkup(userData) {
        let markup = '';
        userData.forEach(user1 => {
            markup += `
        <div class="searched_user_row recentSearch">
            <a href='/user/${user1.userName}' class='recentSearch'>
                <input type='hidden' value="${user1._id}">
                <img src="/Images/${user1.profileImage}" alt="">
                <div class="searched_user_detail">
                    <p>${user1.userName}</p>
                    <p>${user1.name}</p>
                </div>
            </a>
            <!-- <i class="fa-solid fa-xmark"></i> -->
        </div>`
        });
        return markup;
    }

    // Adding User to Recent Search
    document.addEventListener('click', function (event) {
        const recentSearchDiv = event.target.closest('.recentSearch');
        if (recentSearchDiv) {
            let userid = recentSearchDiv.querySelector('input').value;
            // console.log(userid);
            axios.post(`/addSearchedUser/${userid}`);
        }
    });

    // Deleting User from Recent Search
    document.addEventListener('click', function (event) {
        if (event.target.id === 'dltrcntsrch') {
            let recentUserId = event.target.dataset.recentuserid;
            axios.post(`/rmvPrevSearchedUser/${recentUserId}`);
        }
    });

    // Clear Users from Recent Search
    document.addEventListener('click', function (event) {
        if (event.target.id === 'clearBtn') {
            axios.post('/clearRecentSearch');
        }
    })
}
searchJS();

function liveData() {
    const socket = io();

    socket.on('postLiked', (data) => {
        const postId = data.post._id;
        const likeCountElement = document.querySelector(`#post_${postId}_likes`);
        likeCountElement.textContent = data.likeCount + ' Likes';

        let heartIcon = document.querySelector(`.post_${postId}_likes_btn`);

        if (data.post.likes.includes(admin._id) && heartIcon) {
            heartIcon.classList.add('fa-sharp', 'fa-solid');
            heartIcon.classList.remove('fa-regular');
            heartIcon.style.color = 'red';
        } else if (heartIcon) {
            heartIcon.classList.add('fa-regular');
            heartIcon.classList.remove('fa-sharp', 'fa-solid');
            heartIcon.style.color = '#fff';
        }
    });


    // Listen for the 'postCommented' event
    socket.on('postCommented', (data) => {
        const postId = data.postId;

        // Append the new comment to the comments section
        const commentsSection = document.querySelector(`.comment_${postId}_section`);

        const newCommentElement = document.createElement('div');
        newCommentElement.classList.add('comment_row_outer');
        newCommentElement.classList.add(`comment_${data.newComment._id}_dlt`);
        
        const cmntRowInner = document.createElement('div');
        cmntRowInner.classList.add('cmnt_row_inner');
                
        cmntRowInner.innerHTML = `
            <div> <img src="/Images/${data.newComment.author.profileImage}" alt=""> </div>
            <div class="comment_detail">
                <p>${data.newComment.author.userName} &nbsp; &nbsp;<span>${data.newComment.content}</span></p> 
                <input type='hidden' value='${JSON.stringify(data.newComment)}'>                           
                <p><span id='replyBtn'>Reply</span> <i class="fa-solid fa-ellipsis" id='dltCmntpopup'></i></p>
            </div>
        `;
        
        newCommentElement.appendChild(cmntRowInner);
        
        const showReplyBtn = document.createElement('div');
        showReplyBtn.classList.add('showreplybtn');
        showReplyBtn.id = 'showreplybtn';
        showReplyBtn.textContent = 'View all replies';
        
        // newCommentElement.appendChild(showReplyBtn);
        
        const cmntRplyOuter = document.createElement('div');
        cmntRplyOuter.classList.add('cmnt_rply_outer',`com_${data.newComment._id}_reply`);
        cmntRplyOuter.id = 'cmnt_rply_outer';
        
      
        
        newCommentElement.appendChild(cmntRplyOuter);
        
        if(commentsSection) commentsSection.appendChild(newCommentElement);
    });

    socket.on("postSaved",(data)=>{
        let bookMarkIcon = document.querySelector(`.post_${data.postId}_saved_btn`);
        if (data.user._id===admin._id && bookMarkIcon && data.flag) {
            bookMarkIcon.classList.add('fa-solid');
            bookMarkIcon.classList.remove('fa-regular');
            bookMarkIcon.style.color = '#fff';
        } else if (bookMarkIcon) {
            bookMarkIcon.classList.add('fa-regular');
            bookMarkIcon.classList.remove('fa-solid');
            bookMarkIcon.style.color = '#fff';
        }
    })

    socket.on('removercntSearch',(data)=>{
        document.getElementById(`search_${data.id}_us`).remove();
    });

    socket.on('clearRecent',(data)=>{
        document.querySelector(".searched_users").innerHTML=" ";
    });

    socket.on('commentDeleted',(data)=>{
        document.querySelector(`.comment_${data.commentId}_dlt`).remove();
    });

    socket.on('replyAdded',(data)=>{
        let comReplySection = document.querySelector(`.com_${data.cmntId}_reply`);

        const replyRow = document.createElement('div');
        replyRow.classList.add('cmnt_reply_row');
        replyRow.innerHTML=`
        <div> <img src="/Images/${data.reply.author.profileImage}" alt=""></div>
        <div class="cmnt_reply_detail">
            <p>${data.reply.author.userName} &nbsp; &nbsp;<span>${data.reply.content}</span></p> 
            <input type='hidden' value='${JSON.stringify(data.reply)}'>                           
            <p><span id='replyBtn'>Reply</span> <i class="fa-solid fa-ellipsis" id='dltCmntpopup'></i></p>
        </div>`

        if(comReplySection) comReplySection.appendChild(replyRow);
    });

}
liveData();















