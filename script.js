import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAMCJgfC_lox-EIEelRRh-7VjriZ7dftP0",
  authDomain: "myalbumproject-dca7f.firebaseapp.com",
  projectId: "myalbumproject-dca7f",
  storageBucket: "myalbumproject-dca7f.firebasestorage.app",
  messagingSenderId: "685476424363",
  appId: "1:685476424363:web:b6c91eb7d57e37d60d65ee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Cloudinary Details
const cloudName = 'dmx3gppso';
const uploadPreset = 'Imageuploader';

// Upload image to Cloudinary
async function uploadImage() {
  const fileInput = document.getElementById('fileInput');
  const titleInput = document.getElementById('titleInput');
  const file = fileInput.files[0];
  const title = titleInput.value.trim();

  if (!file || !title) {
    alert('Select file and write a title.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, formData);
    const imageUrl = response.data.secure_url;
    const deleteToken = response.data.delete_token;

    // Save image URL, title, and delete token to Firestore
    await addDoc(collection(db, "images"), {
      url: imageUrl,
      title: title,
      delete_token: deleteToken,
      timestamp: Date.now()
    });

    alert('Image uploaded successfully!');
    fileInput.value = "";
    titleInput.value = "";
    loadGallery();
  } catch (error) {
    console.error('Upload Error:', error);
    alert('Error uploading image.');
  }
}

// Load Gallery
async function loadGallery() {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "images"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const imgCard = document.createElement('div');
    imgCard.className = 'img-card';

    const img = document.createElement('img');
    img.src = data.url;
    img.alt = data.title;

    const title = document.createElement('p');
    title.textContent = data.title;

    const editBtn = document.createElement('button');
    editBtn.textContent = "✏️ Edit Title";
    editBtn.onclick = () => editTitle(docSnap.id, data.title);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = "🗑️ Delete";
    deleteBtn.onclick = () => deleteImage(docSnap.id, data.delete_token);

    imgCard.appendChild(img);
    imgCard.appendChild(title);
    imgCard.appendChild(editBtn);
    imgCard.appendChild(deleteBtn);

    gallery.appendChild(imgCard);
  });
}

// Edit Title
async function editTitle(docId, currentTitle) {
  const newTitle = prompt('Enter new title:', currentTitle);
  if (newTitle && newTitle !== currentTitle) {
    await updateDoc(doc(db, "images", docId), { title: newTitle });
    loadGallery();
  }
}

// Delete Image
async function deleteImage(docId, deleteToken) {
  if (!confirm('Are you sure to delete this image?')) return;

  try {
    await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/delete_by_token`, {
      token: deleteToken
    });

    await deleteDoc(doc(db, "images", docId));
    loadGallery();
  } catch (error) {
    console.error('Delete Error:', error);
    alert('Error deleting image.');
  }
}

// Load gallery on page load
loadGallery();
