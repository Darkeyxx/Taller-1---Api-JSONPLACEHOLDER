const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';
const USERS_URL = 'https://jsonplaceholder.typicode.com/users';

// Referencias al DOM
const postsContainer = document.getElementById('posts-container');
const loadingSpinner = document.getElementById('loading-spinner');
const errorMessage = document.getElementById('error-message');
const searchInput = document.getElementById('search-input');

// Referencias al Modal de Crear
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const postModal = document.getElementById('post-modal');
const newPostForm = document.getElementById('new-post-form');
const newTitleInput = document.getElementById('new-title');
const newBodyInput = document.getElementById('new-body');
const newAuthorSelect = document.getElementById('new-author'); // <-- NUEVA REFERENCIA

// Referencias al Modal del Autor
const authorModal = document.getElementById('author-modal');
const closeAuthorModalBtn = document.getElementById('close-author-modal-btn');
const authorModalName = document.getElementById('author-modal-name');
const authorModalId = document.getElementById('author-modal-id');
const authorModalUsername = document.getElementById('author-modal-username');
const authorModalEmail = document.getElementById('author-modal-email');
const authorModalPhone = document.getElementById('author-modal-phone');
const authorModalWebsite = document.getElementById('author-modal-website');

// Estado global
let allPosts = [];
let allUsers = []; // <-- NUEVA VARIABLE GLOBAL PARA GUARDAR USUARIOS


/**
 * Inicializar aplicación (Fetch en paralelo)
 */
async function initApp() {
    showLoading(true);
    showError(false);

    try {
        const [postsResponse, usersResponse] = await Promise.all([
            fetch(POSTS_URL),
            fetch(USERS_URL)
        ]);

        if (!postsResponse.ok || !usersResponse.ok) {
            throw new Error('Error al conectar con el servidor.');
        }

        const posts = await postsResponse.json();
        const users = await usersResponse.json();

        // =========================================================
        // AQUÍ VA EL "PASO 2": GUARDAR USUARIOS Y LLENAR EL SELECT
        // =========================================================
        allUsers = users; // Guardamos los usuarios en la variable global

        // Llenamos el <select> del HTML con los usuarios de la API
        let opcionesHTML = '';
        
        // Opción extra por si quieres seguir publicando como "Tú"
        opcionesHTML += `<option value="999">Tú (Autor Actual)</option>`;
        
        // Opciones de la API
        opcionesHTML += allUsers.map(user => 
            `<option value="${user.id}">${user.name} (@${user.username})</option>`
        ).join('');
        
        newAuthorSelect.innerHTML = opcionesHTML;
        // =========================================================

        // Enriquecer posts con el objeto autor completo
        allPosts = posts.map(post => {
            const author = users.find(user => user.id === post.userId);
            return {
                ...post,
                author: author || { 
                    id: 'N/A', name: 'Desconocido', username: 'N/A', 
                    email: 'N/A', phone: 'N/A', website: 'N/A' 
                }
            };
        });

        renderPosts(allPosts);

    } catch (error) {
        console.error('Hubo un problema:', error);
        showError(true);
    } finally {
        showLoading(false);
    }
}

/**
 * Renderizar tarjetas en el DOM
 */
function renderPosts(postsToRender) {
    if (postsToRender.length === 0) {
        postsContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">No se encontraron publicaciones.</p>`;
        return;
    }

    const postsHTML = postsToRender.map(post => `
        <article class="post-card" data-post-id="${post.id}">
            <div>
                <h2 class="post-title">${post.title}</h2>
                <p class="post-body">${post.body}</p>
            </div>
            <span class="post-author">✍️ ${post.author.name}</span>
        </article>
    `).join('');

    postsContainer.innerHTML = postsHTML;
}

/**
 * EVENTO: Abrir modal del Autor al hacer clic en una tarjeta
 */
postsContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.post-card');
    if (!card) return; 

    const postId = Number(card.dataset.postId);
    const post = allPosts.find(p => p.id === postId);
    
    if (!post) return;

    const author = post.author;

    authorModalName.textContent = author.name;
    authorModalId.textContent = author.id;
    authorModalUsername.textContent = author.username;
    authorModalEmail.textContent = author.email;
    authorModalPhone.textContent = author.phone;
    authorModalWebsite.textContent = author.website;

    authorModal.classList.remove('hidden');
});

/**
 * CONTROL DE MODALES (Abrir / Cerrar)
 */
openModalBtn.addEventListener('click', () => {
    postModal.classList.remove('hidden');
    newTitleInput.focus();
});

closeModalBtn.addEventListener('click', () => {
    postModal.classList.add('hidden');
});

closeAuthorModalBtn.addEventListener('click', () => {
    authorModal.classList.add('hidden');
});

window.addEventListener('click', (e) => {
    if (e.target === postModal) postModal.classList.add('hidden');
    if (e.target === authorModal) authorModal.classList.add('hidden');
});


/**
 * EVENTO: Crear nueva publicación (Petición POST)
 */
newPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // =========================================================
    // AQUÍ VA EL "PASO 3": LEER EL AUTOR DEL SELECT Y GUARDARLO
    // =========================================================
    const selectedAuthorId = Number(newAuthorSelect.value);
    const title = newTitleInput.value.trim();
    const body = newBodyInput.value.trim();

    if (!title || !body) return;

    const newPostPayload = {
        title: title,
        body: body,
        userId: selectedAuthorId // Usamos el ID seleccionado en el select
    };

    try {
        const response = await fetch(POSTS_URL, {
            method: 'POST',
            body: JSON.stringify(newPostPayload),
            headers: { 'Content-type': 'application/json; charset=UTF-8' },
        });

        if (!response.ok) throw new Error('Error en el servidor.');

        const createdPost = await response.json();
        
        // Lógica para asignar los datos del autor dependiendo de quién se eligió
        if (selectedAuthorId === 999) {
            // Si eligió "Tú", le ponemos los datos que pediste (Desconocidos)
            createdPost.author = { 
                id: 'N/A', 
                name: 'Tú (Autor Actual)', 
                username: 'Desconocido', 
                email: 'Desconocido', 
                phone: 'Desconocido', 
                website: 'Desconocido' 
            };
        } else {
            // Si eligió a un usuario de la API (ej. Leanne Graham), buscamos sus datos reales
            const realAuthor = allUsers.find(user => user.id === selectedAuthorId);
            createdPost.author = realAuthor;
        }

        // Insertamos al inicio
        allPosts.unshift(createdPost);

        // Renderizamos
        renderPosts(allPosts);

        newPostForm.reset();
        postModal.classList.add('hidden');

    } catch (error) {
        console.error('Error al enviar POST:', error);
        alert('No se pudo crear la publicación.');
    }
});

/**
 * EVENTO: Buscador en tiempo real
 */
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) || 
        post.body.toLowerCase().includes(searchTerm) ||
        post.author.name.toLowerCase().includes(searchTerm)
    );

    renderPosts(filteredPosts);
});

// Funciones auxiliares
function showLoading(isLoading) {
    if (isLoading) loadingSpinner.classList.remove('hidden');
    else loadingSpinner.classList.add('hidden');
}

function showError(hasError) {
    if (hasError) errorMessage.classList.remove('hidden');
    else errorMessage.classList.add('hidden');
}

// Iniciar
document.addEventListener('DOMContentLoaded', initApp);