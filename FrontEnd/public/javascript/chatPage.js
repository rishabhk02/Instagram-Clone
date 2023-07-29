// let admin = document.getElementById('adminDetail').value;
// admin = JSON.parse(admin);

let messageMarkup =
    `<div class="middle_section_heading">Messages <i class="fa-regular fa-pen-to-square"  id='fapentosquare'></i></div>
    <div class="oldChat_users">
    
    </div>
`;




function loadOlderChats(){
    let sidebar = document.querySelector(".sidebar");
    let middleSection = document.querySelector(".middle_section");

    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
    middleSection.classList.add('open');
    middleSection.innerHTML = messageMarkup;
    document.querySelector('.middle_section_heading').style.borderBottom = '1px solid rgba(54,54,54)';

    axios.get(`/prevChatUsers`).then(response=>{
        let olderChats = response.data.olderChats;
        document.querySelector('.oldChat_users').innerHTML=generateOldChats(olderChats);
    });

    document.addEventListener('click',function(event){
            // if (event.target.classList.contains('chat_user_row')) {
            if(event.target.id==='cty'){
                let userInput = event.target.closest('.chat_user_row').querySelector('input[type="hidden"]');
                let user2 = JSON.parse(decodeURIComponent(userInput.value));
        
                document.querySelector('.pop_up_section').style.display = 'none';
                let chatsection = document.querySelector(".chat_outer_container");
                chatsection.style.display = 'block';
        
                chatsection.innerHTML = chatSectionHtml(user2);
                chatLogic(admin._id, user2._id);
            }

    })
}
loadOlderChats();

function generateOldChats(chatData){
    let markup=``;
    chatData.forEach(data=>{
    markup+=`<div class="chat_user_row chat_${data.userData._id}_user">
                <input type='hidden' value="${encodeURIComponent(JSON.stringify(data.userData))}">
                <img src="/Images/${data.userData.profileImage}" alt="" id='cty'>
                <div class="chat_user_detail">
                    <p>${data.userData.userName}</p>
                    <p>${data.userData.name}</p>
                </div>
            </div>`
    });
    return markup;
}




let messagePopupmarkup = `
<div class="m_popup_inner">
    <div class="m_header1">
        <p>Message</p>
        <i class="fa-solid fa-xmark" id='pop_up_section_close'></i>
    </div>
    <div class="m_header2">
        <p>To: </p>
        <input type="text" placeholder="Search a user..." id='search_chat_input' autoComplete='off'>
    </div>
    <div class="m_content">
        
    </div>
    <div class="m_footer">
        <div class="startchat_btn" id='startChat_btn'>Start Chat</div>
    </div>
</div>`;



document.getElementById('fapentosquare').addEventListener('click', () => {
    let popup = document.querySelector('.pop_up_section');
    popup.style.display = 'flex';
    popup.innerHTML = messagePopupmarkup;


    document.addEventListener('keyup', function (event) {
        if (event.target.id === 'search_chat_input') {
            let inputvalue = event.target.value.trim();
            if (inputvalue.length === 0) {
                return;
            }
            axios.post('/getAllUsers', { data: inputvalue }).then(response => {
                let userData = response.data.userData;
                userData = userData.slice(0, 5);
                let markup = generateChatSearchMarkup(userData);
                document.querySelector('.m_content').innerHTML = markup;
            });
        }
    });

    function generateChatSearchMarkup(userData) {
        let markup = '';
        userData.forEach(user => {
            markup += `
                <div class="searched_user_row chatSearch" data-user='${JSON.stringify(user)}'>
                    <input type='hidden' value="${user._id}">
                    <img src="Images/${user.profileImage}" alt="">
                    <div class="searched_user_detail">
                        <p>${user.userName}</p>
                        <p>${user.name}</p>
                    </div>        
                </div>`
        });
        return markup;
    }


    document.querySelector('.m_content').addEventListener('click', function (event) {
        const chatSearchElement = event.target.closest('.chatSearch');

        if (chatSearchElement) {
            let user = JSON.parse(chatSearchElement.dataset.user);
            let search_chat_input = document.getElementById('search_chat_input');
            search_chat_input.value = user.userName;

            // Set the data attribute on the clicked element (entire div with class 'chatSearch')
            document.getElementById('startChat_btn').dataset.user = `${JSON.stringify(user)}`;
        }
    });


    document.addEventListener('click', function (event) {
        if (event.target.id === 'startChat_btn') {
            const myDiv = document.querySelector('.startchat_btn');
            const hasCustomAttr = myDiv.hasAttribute('data-user');
            if (hasCustomAttr) {
                let user2 = myDiv.dataset.user;
                user2 = JSON.parse(user2);

                document.querySelector('.pop_up_section').style.display = 'none';
                let chatsection = document.querySelector(".chat_outer_container");
                chatsection.style.display = 'block';
                chatsection.innerHTML = chatSectionHtml(user2);
                chatLogic(admin._id, user2._id);
            }
        }
    })
});


function chatSectionHtml(user2) {
    let markup = `
    <div class="chat_inner_container">
            <div class="chat_header">
                <div class="chat_left_side">
                    <img src="/Images/${user2.profileImage}" alt="">
                    <p>${user2.userName}</p>
                </div>
                <div class="chat_right_side">
                    <i class="fa-solid fa-phone"></i>
                    <i class="fa-solid fa-video"></i>
                    <i class="fa-solid fa-circle-info"></i>                
                </div>
            </div>
            <div class="chat_content">
                <ul id="messages">                    
        
                </ul>
            </div>
            <div class="chat_footer">
                <i class="fa-regular fa-face-smile"></i>
                <input type="text" placeholder="Add a comment....." id="messageInput">
                <p id="sendMessage">Send </p>
            </div>
    </div>`;
    return markup;
}


function chatLogic(user1,user2){   

    let roomData = { user1, user2 };

    const socket = io();

    // Handle room creation
    socket.emit('createRoom', roomData);

    const messageInput = document.getElementById('messageInput');


    socket.on('roomCreated', (roomData) => {
        const { roomId, user1, user2 } = roomData;
        socket.room = roomId;

        // get older messages
        axios.get(`/loadOldMessages/${roomId}`).then(response => {
            let olderMessages = response.data.messages;
            generateMessageMarkup(olderMessages);
        });

        // Handle private chat messages
        document.getElementById('sendMessage').addEventListener('click', (e) => {
            e.preventDefault();
            const message = messageInput.value.trim();
            if(message.length==0) return;
            socket.emit('privateMessage', admin._id, roomId, user1, user2, message);
            messageInput.value = '';
            return;
        });
    });

    // Handle private chat messages
    socket.on('privateMessage', (message) => {
        // Update or append the new message in the chat
        let messages = document.getElementById('messages');
        let liTag = document.createElement('li');       
        
        if (message.sender === admin._id) {
            liTag.classList.add('same');
            liTag.innerHTML = `<p class="text_right">${message.message}</p>`;
        } else {
            liTag.classList.add('other');
            liTag.innerHTML = `
            <img src="/Images/${message.profileImage}" alt="">
            <p>${message.message}</p>
            `;
        }
        messages.appendChild(liTag);

        // Adding recent chat to top
        let rcntChat = message.otherUserDetail;
        if(document.querySelector(`.chat_${rcntChat._id}_user`)){
            document.querySelector(`.chat_${rcntChat._id}_user`).remove();            
        }

        const divElement = document.createElement("div");
        divElement.classList.add("chat_user_row", `chat_${rcntChat._id}_user`);
        divElement.innerHTML=`
        <input type='hidden' value="${encodeURIComponent(JSON.stringify(rcntChat))}">
        <img src="/Images/${rcntChat.profileImage}" alt="" id='cty'>
        <div class="chat_user_detail">
            <p>${rcntChat.userName}</p>
            <p>${rcntChat.name}</p>
        </div>`;

        const firstChild = document.querySelector('.oldChat_users').firstChild;
        document.querySelector('.oldChat_users').insertBefore(divElement, firstChild);
    });
}

function generateMessageMarkup(olderMessages) {
    let messages = document.getElementById('messages');
    olderMessages.forEach((message) => {
        let liTag = document.createElement('li');       
        
        if (message.sender._id === admin._id) {
    
            liTag.classList.add('same');
            liTag.innerHTML = `<p class="text_right">${message.data}</p>`;
        } else {
            liTag.classList.add('other');
            liTag.innerHTML = `
            <img src="/Images/${message.sender.profileImage}" alt="">
            <p>${message.data}</p>
            `;
        }
        messages.appendChild(liTag);
    });
}


// closing pop-up section
document.addEventListener('click', function (event) {
    if (event.target.id === 'pop_up_section_close') {
        document.querySelector('.pop_up_section').style.display = 'none';
    }
});





