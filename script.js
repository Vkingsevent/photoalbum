// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMCJgfC_lox-EIEelRRh-7VjriZ7dftP0",
  authDomain: "myalbumproject-dca7f.firebaseapp.com",
  projectId: "myalbumproject-dca7f",
  storageBucket: "myalbumproject-dca7f.appspot.com",
  messagingSenderId: "685476424363",
  appId: "1:685476424363:web:b6c91eb7d57e37d60d65ee"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Cloudinary details
const cloudName = 'dmx3gppso';
const uploadPreset = 'Imageuploader';

const fileInput = document.getElementById('fileInput');
const titleInput = document.getElementById('titleInput');
const uploadBtn = document.getElementById('uploadBtn');
const gallery = document.getElementById('gallery');

uploadBtn.addEventListener('click', uploadImage);

// Upload Image
async function uploadImage() {
  const file = fileInput.files[0];
  const title = titleInput.value.trim();

  if (!file || !title) {
    alert('Select a file and write a title.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, formData);
    const imageUrl = response.data.secure_url;
    const deleteToken = response.data.delete_token;

    await db.collection('images').add({
      url: imageUrl,
      title: title,
      delete_token: deleteToken,
      created: new Date()
    });

    fileInput.value = "";
    titleInput.value = "";
    loadGallery();
    alert('Uploaded successfully!');
  } catch (error) {
    console.error(error);
    alert('Failed to upload.');
  }
}

// Load Gallery
async function loadGallery() {
  gallery.innerHTML = "";
  const snapshot = await db.collection('images').orderBy('created', 'desc').get();

  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement('div');
    div.className = 'img-card';

    const img = document.createElement('img');
    img.src = data.url;
    img.alt = data.title;

    const title = document.createElement('p');
    title.textContent = data.title;

    const editBtn = document.createElement('button');
    editBtn.textContent = "✏️ Edit";
    editBtn.onclick = () => editTitle(doc.id, data.title);

    const delBtn = document.createElement('button');
    delBtn.textContent = "🗑️ Delete";
    delBtn.onclick = () => deleteImage(doc.id, data.delete_token);

    div.appendChild(img);
    div.appendChild(title);
    div.appendChild(editBtn);
    div.appendChild(delBtn);

    gallery.appendChild(div);
  });
}

// Edit Title
async function editTitle(docId, oldTitle) {
  const newTitle = prompt('Enter new title:', oldTitle);
  if (newTitle && newTitle !== oldTitle) {
    await db.collection('images').doc(docId).update({ title: newTitle });
    loadGallery();
  }
}

// Delete Image
async function deleteImage(docId, deleteToken) {
  if (!confirm('Are you sure to delete?')) return;

  try {
    await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/delete_by_token`, { token: deleteToken });
    await db.collection('images').doc(docId).delete();
    loadGallery();
  } catch (error) {
    console.error(error);
    alert('Error deleting image.');
  }
}

// First Load
loadGallery();
