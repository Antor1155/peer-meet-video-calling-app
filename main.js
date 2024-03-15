// This part is for agora sdk 
let APP_ID = "c725ec6c683640dc8c2c2d87a383e599"

let token = null
let uid = String(Math.floor(Math.random() * 10000))

let client;
let channel;


// getting url location 
let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get("room")

if(!roomId){
    window.location = "lobby.html"
}

// this part if for webRtc 
let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers: [
        {
            urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"]
        }
    ]
}

let init = async () => {

    // ***********************
    // this part is for getting video
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })

    document.getElementById("user-1").srcObject = localStream


    // this part is for agora sdk
    client = await AgoraRTM.createInstance(APP_ID)

    await client.login({ uid, token })

    //index.html?room=234234
    channel = client.createChannel(roomId)
    await channel.join()

    // when a user joins the channel
    channel.on("MemberJoined", handleUserJoined)

    //when a user leaves the channer
    channel.on("MemberLeft", handleUserLeft)

    // when a user gets a message 
    client.on('MessageFromPeer', handleMessgaeFromPeer)


}

let handleUserJoined = async (memberId) => {
    // console.log("User joined: ", memberId)

    createOffer(memberId)
}

let handleUserLeft = () =>{
    document.getElementById("user-2").style.display = "none"
}


const handleMessgaeFromPeer = async (message, memberId) => {
    message = JSON.parse(message.text)

    // console.log("message: ", message, "from: ", memberId)

    if(message.type === "offer"){
        createAnswer(memberId, message.offer)
    }

    if(message.type === "answer"){
        addAnswer(message.answer)
    }

    if(message.type === "candidate"){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }

}


let createPeerConnection = async (memberId) => {
    peerConnection = new RTCPeerConnection(servers)
    remoteStream = new MediaStream()

    document.getElementById("user-2").srcObject = remoteStream
    document.getElementById("user-2").style.display = "block"


    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track)
        })
    }


    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            client.sendMessageToPeer({
                text: JSON.stringify({
                    type: "candidate",
                    candidate: event.candidate
                })
            }, memberId)
        }
    }
}


let createOffer = async (memberId) => {

    await createPeerConnection(memberId)

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)


    // this part to send the offer to other user when connected 

    client.sendMessageToPeer({
        text: JSON.stringify({
            type: "offer",
            offer: offer
        })
    }, memberId)


}


let createAnswer = async (memberId, offer) => {
    await createPeerConnection(memberId)

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({
        text: JSON.stringify({
            type: "answer",
            answer
        })
    }, memberId)
}

let addAnswer = async (answer) =>{

    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

let leaveChannel = async () =>{
    await channel.leave()
    await client.logout()
}


window.addEventListener("beforeunload", leaveChannel)


init()