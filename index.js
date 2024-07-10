import { firebaseConfig } from './config.js';
// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';
import './tablaController.js';
// Add the Firebase products and methods that you want to use
import {
  getAuth,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

import {
  getFirestore,
  addDoc,
  doc,
  collection,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('regalos_posibles');
const regalo = document.getElementById('regalo');
const exclude = document.getElementById('excludeInput');
const reciever = document.getElementById('recieverInput');
const guestbook = document.getElementById('todos_regalos');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

let db, auth;

console.log('CARGADO EL JAVASCRIPT');

async function main() {
  // Your web app's Firebase configuration
  initializeApp(firebaseConfig);
  auth = getAuth();
  db = getFirestore();

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      {
        provider: EmailAuthProvider.PROVIDER_ID,
        requireDisplayName: false,
      },
    ],

    callbacks: {
      signUpSuccessWithAuthResult: function (result) {
        return false;
      },
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        console.log(authResult);
        return false;
      },
    },
  };

  const ui = new firebaseui.auth.AuthUI(auth);

  startRsvpButton.addEventListener('click', () => {
    if (auth.currentUser) {
      signOut(auth);
    } else {
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });
  onAuthStateChanged(auth, (user) => {
    if (user) {
      startRsvpButton.textContent = 'Cerrar Sesión';
      guestbookContainer.style.display = 'block';
    } else {
      startRsvpButton.textContent = 'Iniciar Sesión';
      guestbookContainer.style.display = 'none';
    }
  });

  loadRecievers();
  loadRegalos();
}
main();

function loadButtons(q) {
  const unsubscribe = onSnapshot(q, (snaps) => {
    var senderSelection = document.getElementById('senderSelection');
    //Se borran todos los botones, en caso de que hubiesen
    senderSelection.innerHTML = '';
    var stop = false;
    snaps.forEach((docum) => {
      //Si se para, solo es necesario mostrar la tabla de regalos
      if (stop) {
        guestbook.style = 'display:block';
        unsubscribe();
      }
      var destinatario = docum.data().reciever;
      var senderButton = document.createElement('button');
      senderButton.innerHTML = destinatario;

      //Si el usuario ya ha sido seleccionado, no te deja seleccionarlo
      if ('userID' in docum.data()) {
        senderButton.addEventListener('click', () => {
          alert('ESTE USUARIO YA HA SIDO SELECCIONADO');
        });
        senderButton.style = 'background-color: red;';
      } else {
        senderButton.addEventListener('click', () => {
          updateParticipanteID(docum.id);
        });
      }

      //Si el usuario es uno de los que existen, borra todos y no carga mas
      if (idIsUser(docum.data().userID)) {
        stop = true;
        //senderSelection.innerHTML=''
        senderButton.style = 'background-color: green;';
      }
      senderSelection.appendChild(senderButton);
    });

    if (stop) {
      unsubscribeSenderButtons();
    }
  });
}

function unsubscribeSenderButtons() {
  var senderSelection = document.getElementById('senderSelection');
  var buttons = senderSelection.getElementsByTagName('button');

  for (var i = buttons.length - 1; i >= 0; i--) {
    var button = buttons[i];
    const newButton = button.cloneNode(true);

    newButton.addEventListener('click', () => {
      alert('YA HAS SELECCIONADO USUARIO, NO PUEDES ESCOGER OTRO');
    });
    button.parentNode.replaceChild(newButton, button);
  }
}

function idIsUser(userID) {
  // Verificar si auth.currentUser es null o undefined antes de acceder a la propiedad uid
  if (auth && auth.currentUser && auth.currentUser.uid && userID) {
    return auth.currentUser.uid == userID;
  }
  return false;
}

function updateParticipanteID(documid) {
  // Actualizar el documento en Firestore
  const participantesRef = collection(db, 'participantes');

  // Actualizar el campo 'userId' con el valor actual de auth.currentUser.uid
  updateDoc(doc(db, 'participantes', documid), {
    userID: auth.currentUser.uid,
  })
    .then(() => {
      console.log('Documento actualizado con éxito');
    })
    .catch((error) => {
      console.error('Error al actualizar el documento:', error);
    });
}

function setList(doc) {
  var reciever = doc.data().reciever; //nombre
  var sender_id = doc.data().sender; // ID Del que lo ha enviado
  var lista_reciever = document.getElementById(`lista_${reciever}`);
  var list_id = lista_reciever.getAttribute('reciever_id');
  var list_item = document.createElement('li');
  var list_span = document.createElement('span');
  var list_icon = document.createElement('i');

  var thumbs = 'fa-thumbs-up';
  if (doc.data().exclude) {
    thumbs = 'fa-thumbs-down';
  }

  list_icon.classList.add('fa-solid', thumbs);

  list_span.className = 'fa-li';
  list_item.textContent = doc.data().regalo;

  list_span.appendChild(list_icon);
  list_item.appendChild(list_span);
  if (idIsUser(list_id)) {
  }

  if (sender_id == list_id) {
    var crown_icon = document.createElement('i');
    crown_icon.classList.add('fa-solid', 'fa-crown');
    list_item.appendChild(crown_icon);
  }
  if (idIsUser(list_id) && !idIsUser(sender_id)) {
    console.log('NO SE AÑADE A LA LISTA');

    return;
  }
  lista_reciever.appendChild(list_item);
}

function loadRegalos() {
  const q = query(collection(db, 'regalos'), orderBy('timestamp', 'desc'));

  onSnapshot(q, (snaps) => {
    var count_regalos = 0;
    //Se limpian todos los regalos
    const listas_regalos = document.getElementsByClassName('fa-ul');

    // Convertir la colección a un array usando Array.from
    const arrayDeListas = Array.from(listas_regalos);

    // O usar el operador de propagación
    // const arrayDeListas = [...listas_regalos];

    arrayDeListas.forEach((lista) => {
      lista.innerHTML = '';
    });

    snaps.forEach((doc) => {
      count_regalos += 1;
      setList(doc);
    });
    console.log(count_regalos);
  });
}

function loadFilaLabels(tabla, destinatario) {
  var fila_labels = tabla.querySelector('#fila_labels');
  var td = document.createElement('td');
  var label = document.createElement('label');
  label.textContent = `Regalos para ${destinatario}`;
  td.appendChild(label);
  fila_labels.appendChild(td);
}

function loadFilaRegalos(tabla, destinatario, recieverID) {
  var fila_regalos = tabla.querySelector('#fila_regalos');
  var td = document.createElement('td');
  var ul = document.createElement('ul');
  ul.id = `lista_${destinatario}`;

  ul.setAttribute('reciever_id', recieverID);
  ul.className = 'fa-ul';
  td.appendChild(ul);
  fila_regalos.appendChild(td);
}

function subscribeForm(form) {
  form.addEventListener('submit', async (e) => {
    // Prevent the default form redirect
    e.preventDefault();

    // Access form elements using form.querySelector
    const regaloInput = form.getElementsByClassName('regaloInput')[0];
    const excludeCheckbox = form.getElementsByClassName('excludeInput')[0];
    const recieverInput = form.getElementsByClassName('recieverInput')[0];

    // Write a new message to the database collection
    await addDoc(collection(db, 'regalos'), {
      regalo: regaloInput.value,
      exclude: excludeCheckbox.checked,
      reciever: recieverInput.value,
      timestamp: Date.now(),
      sender: auth.currentUser.uid,
    });

    // Clear message input field
    regaloInput.value = '';

    // Return false to avoid redirect (not necessary with preventDefault)
    // return false;
  });
}

function loadFilaFormularios(tabla, destinatario) {
  var fila_formulario = tabla.querySelector('#fila_formularios');
  var td = document.createElement('td');
  var form = document.createElement('form');

  form.id = `formulario_${destinatario}`;
  form.className = 'regalos_posibles';

  const recieverInput = document.createElement('input');
  recieverInput.type = 'hidden';
  recieverInput.className = 'recieverInput';
  recieverInput.name = 'reciever';
  recieverInput.value = destinatario;

  form.appendChild(recieverInput);
  const label = document.createElement('label');
  label.className = 'excludeLabel';
  // Crear el elemento input (checkbox)
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'excludeInput';
  checkbox.name = 'exclude';

  // Crear el elemento span con la clase "label"
  const spanLabel = document.createElement('span');
  spanLabel.classList.add('label');

  // Crear el elemento i con las clases "fa-solid" y "fa-thumbs-up"
  const icon = document.createElement('i');
  icon.classList.add('fa-solid', 'fa-thumbs-up');

  // Anidar los elementos
  spanLabel.appendChild(icon);
  label.appendChild(checkbox);
  label.appendChild(spanLabel);

  form.appendChild(label);

  var regaloInput = document.createElement('input');
  regaloInput.type = 'text';
  regaloInput.className = 'regaloInput';
  regaloInput.name = 'regalo';
  regaloInput.placeholder = 'Escribe el regalo aqui';
  form.appendChild(regaloInput);

  var botonSubmit = document.createElement('button');
  var iconoSubmit = document.createElement('i');
  iconoSubmit.className = 'material-icons';
  iconoSubmit.textContent = 'send';
  botonSubmit.appendChild(iconoSubmit);
  var spanSubmit = document.createElement('span');
  spanSubmit.textContent = 'Enviar';

  botonSubmit.appendChild(spanSubmit);
  form.appendChild(botonSubmit);

  subscribeForm(form);
  td.appendChild(form);
  fila_formulario.appendChild(td);
}

function loadTablas(q) {
  var tabla = document.getElementById('tabla_regalos');
  if (tabla == null) {
    return;
  }
  const unsubscribe = onSnapshot(q, (snaps) => {
    //guestbook.innerHTML = '';

    snaps.forEach((docum) => {
      var recieverID = docum.data().userID;
      var destinatario = docum.data().reciever;

      loadFilaLabels(tabla, destinatario);
      loadFilaRegalos(tabla, destinatario, recieverID);
      loadFilaFormularios(tabla, destinatario);
    });
    //Solo es necesario cargar las tablas una vez
    unsubscribe();
  });
}

function loadRecievers() {
  const q = query(collection(db, 'participantes'));
  loadButtons(q);
  loadTablas(q);
}
