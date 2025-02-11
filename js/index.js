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

let editImg = `<svg class="black" vёiewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75l11-11-3.75-3.75-11 11zM14.75 3l3.75 3.75 1.5-1.5-3.75-3.75-1.5 1.5z"/></svg>`;

let deleteImg = `<svg class="black" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
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

  const postText = document.getElementById("postText").value;
  if (!postText.trim()) {
    showToast("Нельзя отправить пустой пост!");
    return;
  }

  const postId = nanoid(); // Генерируем уникальный ID
  const postRef = ref(db, `posts/${postId}`);
  await set(postRef, {
    text: postText,
    userId: user.uid,
    timestamp: Date.now(),
  });

  document.getElementById("postText").value = ""; // Очищаем поле
  showToast("Пост опубликован!");
  loadPosts();

  // Удаляем пост через 24 часа
  setTimeout(() => {
    remove(postRef)
      .then(() => {
        console.log("Пост удален через 24 часа");
        loadPosts(); // Перезагружаем посты после удаления
      })
      .catch((error) => {
        console.error("Ошибка при удалении поста:", error);
      });
  }, 86400000); // 24 часа в миллисекундах
}

// 📌 Загрузка постов
async function loadPosts() {
  const user = auth.currentUser;
  if (!user) return;

  const postsContainer = document.getElementById("postsContainer");
  if (!postsContainer) {
    console.error("Ошибка: элемент #postsContainer не найден!");
    return;
  }

  postsContainer.innerHTML = ""; // Очистка перед загрузкой

  const postsRef = ref(db, "posts");
  const snapshot = await get(postsRef);

  const postsArray = [];
  const currentTime = Date.now(); // Текущее время

  snapshot.forEach((childSnapshot) => {
    const post = childSnapshot.val();
    if (post.userId === user.uid) {
      if (currentTime - post.timestamp > 86400000) {
        // Удаляем пост, если он старше 24 часов
        remove(ref(db, `posts/${childSnapshot.key}`));
      } else {
        postsArray.push({
          key: childSnapshot.key,
          text: post.text,
          timestamp: post.timestamp,
        });
      }
    }
  });

  // Сортируем посты по времени создания (по убыванию)
  postsArray.sort((a, b) => b.timestamp - a.timestamp);

  // Добавляем посты в контейнер
  postsArray.forEach((post) => {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.innerHTML = `
                <span>${post.text}</span>
                <div class="post-buttons">
                    <button class="edit-btn" onclick="showEditModal('${post.key}', '${post.text}')">${editImg}</button>
                    <button class="delete-btn" onclick="deletePost('${post.key}')">${deleteImg}</button>
                </div>
            `;
    postsContainer.appendChild(postElement); // Добавляем в конец
  });
}

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
