async function sendData() {
  const text = document.getElementById('textInput').value;
  const files = document.getElementById('fileInput').files;
  const maxReceivers = document.getElementById('receiverInput').value || 1;
  const expiryMinutes = document.getElementById('expiryInput').value || 10;

  const formData = new FormData();
  formData.append('maxReceivers', maxReceivers);
  formData.append('expiryMinutes', expiryMinutes);

  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i]);
    }
  }

  if (text.trim() !== '') {
    formData.append('text', text);
  }

  // Upload with progress
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/send');

  xhr.upload.onprogress = function (e) {
    if (e.lengthComputable) {
      const percent = Math.round((e.loaded / e.total) * 100);
      document.getElementById('sendResult').innerText = `Uploading: ${percent}%`;
    }
  };

  xhr.onload = function () {
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      document.getElementById('sendResult').innerText = `Code: ${data.code}`;
      showToast(`✅ Sent Successfully! Code: ${data.code}`);
    } else {
      document.getElementById('sendResult').innerText = 'Server error.';
    }
  };

  xhr.onerror = function () {
    alert('Upload failed.');
  };

  xhr.send(formData);
}

async function receiveData() {
  const code = document.getElementById('codeInput').value;
  const res = await fetch(`/api/receive/${code}`);
  const data = await res.json();

  const receiveResult = document.getElementById('receiveResult');
  const textBlock = document.getElementById('textBlock');
  const filesBlock = document.getElementById('filesBlock');
  const fileLinks = document.getElementById('fileLinks');

  textBlock.classList.add('hidden');
  filesBlock.classList.add('hidden');
  fileLinks.innerHTML = "";

  if (data.error === 'Code expired') {
    receiveResult.innerText = "Code expired!";
    return;
  }

  receiveResult.innerText = ""; // Clear any error messages if successful

  if (data.text) {
    textBlock.innerText = data.text;
    textBlock.classList.remove('hidden');
  }

  if (data.files && data.files.length > 0) {
    fileLinks.innerHTML = data.files.map(file =>
      `<a href="${file.url}" download class="text-blue-500 block">${file.filename}</a>`).join('');
    filesBlock.classList.remove('hidden');
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove('opacity-0');
  toast.classList.add('opacity-100');

  setTimeout(() => {
    toast.classList.remove('opacity-100');
    toast.classList.add('opacity-0');
  }, 3000);
}


