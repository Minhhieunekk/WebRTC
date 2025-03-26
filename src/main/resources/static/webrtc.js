const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const ws = new WebSocket("ws://localhost:8080/ws");
const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
});

ws.onmessage = async (event) => {
    const message = JSON.parse(event.data);

    if (message.offer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        ws.send(JSON.stringify({ answer }));
    } else if (message.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.iceCandidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.iceCandidate));
    }
};

// Lấy stream video/audio từ camera
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    });

peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
};

// Gửi ICE Candidate đến WebSocket
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        ws.send(JSON.stringify({ iceCandidate: event.candidate }));
    }
};

// Tạo Offer để bắt đầu cuộc gọi
peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => ws.send(JSON.stringify({ offer: peerConnection.localDescription })));

