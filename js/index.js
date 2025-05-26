import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { nanoid } from "https://cdn.jsdelivr.net/npm/nanoid/nanoid.js";

// Инициализация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBE4riodBZmu32r1Si8dvi3LZNG28JeOzA",
  authDomain: "minidairy-59182.firebaseapp.com",
  databaseURL:
    "https://minidairy-59182-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "minidairy-59182",
  storageBucket: "minidairy-59182.appspot.com",
  messagingSenderId: "454703141412",
  appId: "1:454703141412:web:0becaac22c944aeb7a7eb1",
  measurementId: "G-JG61L9XSXN",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🔥 Показать Toastify
function showToast(message) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "center",
    backgroundColor: "#4CAF50",
    stopOnFocus: true,
  }).showToast();
}

// 🚀 Регистрация
async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    showModal("Аккаунт создан!");
  } catch (error) {
    showModal(error.message);
  }
}

// 🔑 Вход
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast("Вы вошли!");
  } catch (error) {
    showToast(error.message);
  }
}

// 🔥 Google Login
async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
    showToast("Вы вошли через Google!");
  } catch (error) {
    showToast(error.message);
  }
}

// 🚪 Выход
async function logout() {
  await signOut(auth);
  showToast("Вы вышли!");
}

// ✍ Добавить пост
async function addPost() {
  const user = auth.currentUser;
  if (!user) {
    showToast("Сначала войдите в систему!");
    return;
  }

  const postText = document.getElementById("postText").value.trim();
  if (!postText) {
    showToast("Пост не может быть пустым!");
    return;
  }

  try {
    const newPostRef = push(ref(db, 'posts'));
    await set(newPostRef, {
      text: postText,
      userId: user.uid,
      timestamp: Date.now(),
      username: user.displayName || user.email.split('@')[0]
    });
    
    document.getElementById("postText").value = "";
    showToast("Пост опубликован!");
    loadPosts();
  } catch (error) {
    showToast("Ошибка при публикации поста: " + error.message);
  }
}

// 📌 Загрузка постов
async function loadPosts() {
  try {
    const postsContainer = document.getElementById("postsContainer");
    postsContainer.innerHTML = "";
    
    const snapshot = await get(ref(db, 'posts'));
    const posts = [];
    
    snapshot.forEach(post => {
      const postData = post.val();
      posts.push({
        id: post.key,
        ...postData
      });
    });

    // Sort posts by timestamp (newest first)
    posts.sort((a, b) => b.timestamp - a.timestamp);

    posts.forEach(post => {
      const timestamp = new Date(post.timestamp).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const postElement = document.createElement('div');
      postElement.className = 'post';
      postElement.innerHTML = `
        <div class="post-header">
          <div class="user-info">
            <span class="username">${post.username}</span>
          </div>
          <span class="timestamp">${timestamp}</span>
        </div>
        <div class="post-content">${post.text}</div>
        <div class="post-actions">
          <button onclick="editPost('${post.id}', '${post.text}')">✏️</button>
          <button onclick="showConfirmModal('Удалить этот пост?', () => deletePost('${post.id}'))">🗑️</button>
        </div>
      `;
      postsContainer.appendChild(postElement);
    });
  } catch (error) {
    showToast("Ошибка при загрузке постов: " + error.message);
  }
}

// 🔍 Search posts
function searchPosts() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.toLowerCase();
  const posts = document.querySelectorAll('.post');
  
  posts.forEach(post => {
    const text = post.querySelector('.post-content').textContent.toLowerCase();
    const username = post.querySelector('.username').textContent.toLowerCase();
    
    if (text.includes(query) || username.includes(query)) {
      post.style.display = 'block';
    } else {
      post.style.display = 'none';
    }
  });
}

// Global loading state
let isLoading = false;

// Show loading indicator
function showLoading(show = true) {
  isLoading = show;
  const loadingElements = document.querySelectorAll('.loading');
  loadingElements.forEach(el => el.style.display = show ? 'block' : 'none');
}

// Add loading class to buttons
const buttons = document.querySelectorAll('button');
buttons.forEach(button => {
  button.classList.add('loading');
});

// Функция редактирования поста
async function editPost(postId, oldText) {
  showEditModal(postId, oldText);
}

// Функция удаления поста
async function deletePost(postId) {
  const postRef = ref(db, `posts/${postId}`);
  remove(postRef)
    .then(() => {
      console.log("Пост удален");
      loadPosts(); // Перезагружаем посты после удаления
    })
    .catch((error) => {
      console.error("Ошибка при удалении поста:", error);
    });
}

// 👤 Проверка пользователя
onAuthStateChanged(auth, (user) => {
  const loginForm = document.getElementById("loginForm");
  const postSection = document.getElementById("postSection");
  const postsContainer = document.getElementById("postsContainer");
  const logoutButton = document.getElementById("logoutButton");

  if (user) {
    // Пользователь вошел в систему
    loginForm.style.display = "none"; // Скрываем форму логина
    postSection.style.display = "flex"; // Показываем секцию для добавления постов
    postsContainer.style.display = "flex"; // Показываем контейнер постов
    logoutButton.style.display = "block"; // Показываем кнопку "Выйти"
    loadPosts(); // Загружаем посты
  } else {
    // Пользователь не вошел в систему
    loginForm.style.display = "block"; // Показываем форму логина
    postSection.style.display = "none"; // Скрываем секцию для добавления постов
    postsContainer.style.display = "none"; // Скрываем контейнер постов
    logoutButton.style.display = "none"; // Скрываем кнопку "Выйти"
  }
});

// ✅ Делаем функции глобальными
window.register = register;
window.login = login;
window.loginWithGoogle = loginWithGoogle;
window.logout = logout;
window.addPost = addPost;
window.editPost = editPost;
window.deletePost = deletePost;
window.confirmAction = confirmAction;
window.showEditModal = showEditModal;
window.confirmEdit = confirmEdit;
window.closeModal = closeModal;
window.closeEditModal = closeEditModal;

function showModal(message) {
  document.getElementById("modal-message").innerText = message;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

let currentAction = null;

function showConfirmModal(message, action) {
  document.getElementById("confirm-message").innerText = message;
  document.getElementById("confirmModal").classList.remove("hidden");
  currentAction = action; // Сохраняем текущее действие
}

function closeConfirmModal() {
  document.getElementById("confirmModal").classList.add("hidden");
  currentAction = null; // Сбрасываем текущее действие
}

function confirmAction() {
  if (currentAction) {
    currentAction(); // Выполняем сохраненное действие
  }
  closeConfirmModal(); // Закрываем модальное окно
}

let currentEditPostId = null;

function showEditModal(postId, oldText) {
  currentEditPostId = postId; // Сохраняем ID поста для редактирования
  document.getElementById("editText").value = oldText; // Устанавливаем старый текст в текстовое поле
  const modal = document.getElementById("editModal");
  modal.classList.remove("hidden"); // Убираем класс hidden
  modal.style.display = "flex"; // Устанавливаем display flex для центрирования
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  modal.classList.add("hidden"); // Добавляем класс hidden
  modal.style.display = "none"; // Скрываем модальное окно
}

function confirmEdit() {
  const newText = document.getElementById("editText").value;
  if (!newText) return;

  const postRef = ref(db, `posts/${currentEditPostId}`);
  update(postRef, { text: newText });

  Toastify({
    text: "Пост обновлён!",
    duration: 2000,
    gravity: "top",
    position: "center",
    style: { background: "blue" },
  }).showToast();
  loadPosts();
  closeEditModal(); // Закрываем модальное окно после редактирования
}
