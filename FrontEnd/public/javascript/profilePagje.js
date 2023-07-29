// const { default: axios } = require("axios");

let user = document.getElementById('userDetailProfilePage').value;
user= JSON.parse(user);

// saved - posts
document.addEventListener('click',function(event){
    if(event.target.id==='saved_posts'){
        let profileContent = document.querySelector('.profile_content');
        axios.get(`/getSavedPosts/${user._id}`).then(response=>{
            let savedPosts = response.data.savedPosts;
            profileContent.innerHTML=generateSavedPostMarkup(savedPosts);
        })
    }
})

// user-posts
document.addEventListener('click',function(event){
    if(event.target.id==='user_posts'){
        let profileContent = document.querySelector('.profile_content');
        axios.get(`/getPostedPosts/${user._id}`).then(response=>{
            let unsavedPosts = response.data.unsavedPosts;
            profileContent.innerHTML=generateSavedPostMarkup(unsavedPosts);
        })
    }
})


function generateSavedPostMarkup(data) {
    let markup = ``;
    data.forEach(post => {
      const encodedPostData = encodeURIComponent(JSON.stringify(post));
      markup += `
        <div class="posts">
          <img src="/Images/${post.postContent.data}" alt="" id="show_post" data-pos="${encodedPostData}">
        </div>
      `;
    });
    return markup;
  }




document.addEventListener('click',function(event){
    if(event.target.id==='show_post'){        
        const encodedPostData = event.target.dataset.pos;
        const postDetail = JSON.parse(decodeURIComponent(encodedPostData));


        let popUp = document.querySelector(".profile_page_popup");
        popUp.style.display = 'flex';

        axios.get(`/getComments/${postDetail._id}`).then(response => {
            let commentData = response.data.commentData;
            commentData = commentData[0];

            let markup = generateProfileMarkup(commentData,postDetail);
            popUp.innerHTML = markup;
            commentFunction(postDetail);


        }).catch(error => {
            // Handle any errors that occurred during the request
            console.error(error);
        });       

    }
})

function generateProfileMarkup(commentData,postDetail) {
    let markup = `
    <i class="fa-solid fa-xmark" id="profile_pop_up_close"></i>
    <div class="profilePage_post_inner">
        <div class="profilePage_post_left_side">
            <img src="/Images/${commentData.postContent.data}" alt="">
        </div>
        <div class="profilePage_post_right_side forReplyFocus">
            <div class="header">
                <div>
                    <img src="/Images/${commentData.author.profileImage}" alt="">
                    <div class="name_userName">
                        <p>${commentData.author.userName}</p>
                        <p>${commentData.author.name}</p>
                    </div>
                </div>
                <i class="fa-solid fa-ellipsis" id='postDltpopup' data-post='${JSON.stringify(postDetail)}'></i>
            </div>

            <div class=" content profile_content22 comment_${commentData._id}_section">`;

    commentData.comments.forEach(comment => {
        markup += `
                <div class="comment_row_outer comment_${comment._id}_dlt">
                    <div class='cmnt_row_inner'>
                        <img src="/Images/${comment.author.profileImage}" alt="">
                        <div class="comment_detail">
                            <p>${comment.author.userName} &nbsp; &nbsp;<span>${comment.content}</span></p>                            
                            <input type='hidden' value='${JSON.stringify(comment)}'>                           
                            <p><span id='replyBtn'>Reply</span> <i class="fa-solid fa-ellipsis" id='dltCmntpopup'></i></p>
                        </div>
                    </div>`
                    
                    if(comment.replies.length>0){
                        markup+=`<div class='showreplybtn' id='showreplybtn'>View all replies</div>`}      
                        markup+=`<div class='cmnt_rply_outer com_${comment._id}_reply' id='cmnt_rply_outer'>`

                    comment.replies.forEach(reply=>{
                        markup+=`
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

        markup+=   `</div>
                </div>`;
    });

    markup += `
            </div>
            <div class="footer1">
                <div class="like_share_comment">`;

    if(postDetail.likes.includes(user._id)){
        markup+=    `<i class="fa-sharp fa-solid fa-heart post_${postDetail._id}_likes_btn" id="post_like_btn" data-post='${JSON.stringify(postDetail)}' style="color: red;"></i>`;
    }else{
        markup+=    `<i class="fa-regular fa-heart  post_${postDetail._id}_likes_btn" id="post_like_btn"  data-post='${JSON.stringify(postDetail)}'></i>`;
    }
                
    markup+=`
                    <span id="post_${postDetail._id}_likes">${postDetail.likes.length} Likes</span>
                </div>
                <div class="post_save">`;

    if(admin.savedPost.includes(postDetail._id)){
        markup+=`<i class="fa-solid fa-bookmark post_${postDetail._id}_saved_btn" id="save_btn" data-post='${JSON.stringify(postDetail)}'></i>`;
    }else{
        markup+=`<i class="fa-regular fa-bookmark post_${postDetail._id}_saved_btn" id="save_btn" data-post='${JSON.stringify(postDetail)}'></i>`;
    }
                    

    markup+=    `</div>
            </div>
            
            <div class="footer2 add_comment">
                <form action="" id="post_comment_form">
                <div class="add_comment_left_side">
                    <i class="fa-regular fa-face-smile"></i>
                    <input type="text" placeholder="Add a comment....." name="inputComment">
                    <input type="hidden" id="postComment" name="postId" value="${commentData._id}">
                </div>
                <div class="add_comment_right_side">
                    <p id="post_comment_btn">Post</p>
                </div>
                </form>
            </div>
        </div>
    </div>`;

    return markup;
}

// Post Deleting JS
document.addEventListener('click',function(event){
    if(event.target.id==='postDltpopup'){
        let postDetail=JSON.parse(event.target.dataset.post);

        let extraPopup = document.querySelector('.extra_pop_up_section');
        extraPopup.style.display='flex';
        let pstmarkup=`
        <div class='dltCmnt_popup_inner'>`;
        if(postDetail.author===admin._id){
            pstmarkup+=`<p style='color:red' id='dltpstbtn' data-pstid='${postDetail._id}'>Delete</p>`;
        }
        pstmarkup+=`              
        <p id='close_extra_popup'>Cancel</p>
        </div>
        `;
        extraPopup.innerHTML=pstmarkup;
    }
})


// Closing extra popup
document.addEventListener('click',function(event){
    if(event.target.id==='close_extra_popup'){
        document.querySelector('.extra_pop_up_section').style.display='none';
    }
});

// Delete Post JS
document.addEventListener('click',function(event){
    if(event.target.id=='dltpstbtn'){
        let pstId = event.target.dataset.pstid;
        axios.post(`/deletePost/${pstId}`).then(res=>{
            document.querySelector('.extra_pop_up_section').style.display='none';
        });                       
    }
})


// Closing Profile Page Pop-Up
document.addEventListener('click', function (event) {
    if (event.target.id === 'profile_pop_up_close') {
        document.querySelector('.profile_page_popup').style.display = 'none';
    }
});

// Follow Un-Follow JS
document.querySelector('.profile_1row').addEventListener('click',function(event){
    if(event.target.closest('#flwUnflwbtn')){
        if(event.target.closest('#flwUnflwbtn').innerText=='Unfollow'){
            axios.post(`/rmvFollowing/${user._id}`);
        }else{
            axios.post(`/addFollowing/${user._id}`);
        }
    }    
})


// FOLLOWER-FOLLOWING POPUP
let followPopMarkup = `
<div class="follower_inner_container">
    <div class="follower_header_1">
        <p>${user.userName}</p>
        <i class="fa-solid fa-xmark" id="profile_pop_up_close"></i>
    </div>
    <div class="follower_header_2">
        <p>2 mutual</p>
        <p id="getFollower">Follower</p>
        <p id="getFollowing">Following</p>
    </div>

    <div class="follower_content" id="follower_content">

    </div>
</div>
`
document.addEventListener('click', function (event) {
    if(event.target.classList.contains('openFlwPopUp')){
        let popUp = document.querySelector(".profile_page_popup");
        popUp.style.display = 'flex';
        popUp.innerHTML=followPopMarkup;              

        if(event.target.id==='getFollower'){
            axios.get(`/getFollowers/${user._id}`).then(response => {
                document.querySelector('.follower_content').innerHTML=generateFolowMarukup(response.data.followersData,true);
            }).catch(error => { console.error(error); });

        }else{
            axios.get(`/getFollowings/${user._id}`).then(response => {
                document.querySelector('.follower_content').innerHTML=generateFolowMarukup(response.data.followersData,false);
            }).catch(error => { console.error(error); });
        }
    }
});

document.addEventListener('click',function(event){
    if(event.target.id==='getFollower'){
        axios.get(`/getFollowers/${user._id}`).then(response => {
            document.querySelector('.follower_content').innerHTML=generateFolowMarukup(response.data.followersData,true);
        }).catch(error => { console.error(error); });

    }
})

document.addEventListener('click',function(event){
    if(event.target.id==='getFollowing'){
        axios.get(`/getFollowings/${user._id}`).then(response => {
            document.querySelector('.follower_content').innerHTML=generateFolowMarukup(response.data.followersData,false);
        }).catch(error => { console.error(error); });

    }
})

function generateFolowMarukup(datas,isFolower){
    let markup=``;
    datas.forEach(data=>{       
        if(isFolower){
            markup+=`<div class="follower_row folower_${data._id}_user">`;
        }else{
            markup+=`<div class="follower_row folowing_${data._id}_user">`
        }
        
    markup+=`<div class="left_side">
                <img src="/Images/${data.profileImage}" alt="">
                <div class="follower_detail">
                    <div class="follower_username_btn">
                        <p>${data.userName}</p>`;
        if(!data.followers.includes(admin._id) && user._id===admin._id){
            markup+=`<p id='flwbtn' data-userid='${data._id}'>Follow</p>`
        }else{
            markup+=`<p></p>`
        }
      
        markup+=   `</div>
                    <p class="follower_name">${data.name}</p>
                </div>
            </div>`

        if(user._id===admin._id){
            if(isFolower){
                markup+=`<div class="remove_follower_btn" id='rmvFolower' data-userid='${data._id}'>Remove</div>`;
            }else{
                markup+=`<div class="remove_follower_btn" id='rmvFollowing' data-userid='${data._id}'>Remove</div>`;
            }           
        }
            
        markup+=`</div>`
    });
    return markup;
}



// Follow Un-Follow From Popup JS
document.addEventListener('click',function(event){
    if(event.target.id==='flwbtn'){
        let userId = event.target.dataset.userid;
        axios.post(`/addFollowing/${userId}`);
    }

    if(event.target.id==='rmvFolower'){
        let userId = event.target.dataset.userid;
        axios.post(`/removeFollower/${userId}`);
    }

    if(event.target.id==='rmvFollowing'){
        let userId = event.target.dataset.userid;
        axios.post(`/rmvFollowing/${userId}`);
    }
})

function liveUpdate(){
    const socket = io();
    socket.on('addFollow',(data)=>{
        if(document.getElementById('flwUnflwbtn')){
            document.getElementById('flwUnflwbtn').innerHTML="Unfollow";
            document.querySelector('.profile_follower').innerHTML=data.followers+" Followers";
        }
    });

    socket.on('removeFollow',(data)=>{
        if(document.getElementById('flwUnflwbtn')){
            document.getElementById('flwUnflwbtn').innerHTML="Follow";
            document.querySelector('.profile_follower').innerHTML=data.followers+" Followers";
        }else if(document.querySelector(`.folowing_${data.userId}_user`)){
            document.querySelector(`.folowing_${data.userId}_user`).remove();
        }
    });

    socket.on('removeFollower',(data)=>{
        if(document.querySelector(`.folower_${data.userId}_user`)){
            document.querySelector(`.folower_${data.userId}_user`).remove();
        }         
    })

    socket.on('postDeleted',(data)=>{
        location.reload();
    })
}
liveUpdate();
