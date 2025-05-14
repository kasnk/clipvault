async function sendData() {
  const text = document.getElementById('textInput').value;
  const files = document.getElementById('fileInput').files;
  const formData = new FormData();

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
      if (data.code) {
        document.getElementById('sendResult').innerText = `Code: ${data.code}`;
        showToast(`✅ Sent Successfully! Code: ${data.code}`);
      } else {
        document.getElementById('sendResult').innerText = 'Error sending data.';
      }
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

  if (data.type === 'text') {
    document.getElementById('receiveResult').innerText = data.content;
  } else if (data.type === 'file') {
    let fileLinks = data.files.map(file => 
      `<a href="${file.url}" download class="text-blue-500">${file.filename}</a>`).join('<br>');
    document.getElementById('receiveResult').innerHTML = fileLinks;
  } else {
    document.getElementById('receiveResult').innerText = data.error || 'Invalid code.';
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

function clearText() {
  document.getElementById('textInput').value = '';  // Clears text area
}

function clearFiles() {
  document.getElementById('fileInput').value = '';  // Clears selected files
}
