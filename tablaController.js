function asdad() {
  const tabla = document.createElement('table');
  const trlabel = document.createElement('tr');
  const trform = document.createElement('tr');
  var tdlabel = document.createElement('td');
  var tdform = document.createElement('td');
  trlabel.appendChild(tdlabel);
  trform.appendChild(tdform);

  trform.className = 'formulario';
  tabla.id = `tabla_${destinatario}`;
  if (recieverID) {
    tabla.classList.add(recieverID);
  }

  const form = document.createElement('form');
  form.id = `regalos_posibles_${destinatario}`;
  form.className = 'regalos_posibles';
  const label = document.createElement('label');

  label.textContent = `Regalos para ${destinatario}`;
  tdlabel.append(label);
  tabla.appendChild(trlabel);

  const recieverInput = document.createElement('input');
  recieverInput.type = 'hidden';
  recieverInput.className = 'recieverInput';
  recieverInput.name = 'reciever';
  recieverInput.value = destinatario;

  const excludeLabel = document.createElement('label');
  const excludeCheckbox = document.createElement('input');
  const spanLabel = document.createElement('span');
  const iconLabel = document.createElement('i');

  iconLabel.classList.add('fa-solid');
  iconLabel.classList.add('fa-thumbs-up');
  spanLabel.className = 'label';

  excludeCheckbox.type = 'checkbox';
  excludeCheckbox.className = 'excludeInput';
  excludeCheckbox.name = 'exclude';

  excludeLabel.appendChild(excludeCheckbox);
  spanLabel.appendChild(iconLabel);
  excludeLabel.appendChild(spanLabel);

  excludeCheckbox.addEventListener('change', () => {
    iconLabel.classList.toggle('fa-thumbs-up');
    iconLabel.classList.toggle('fa-thumbs-down');
  });

  const regaloInput = document.createElement('input');
  regaloInput.type = 'text';
  regaloInput.className = 'regaloInput';
  regaloInput.name = 'regalo';

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.innerHTML =
    '<i class="material-icons">send</i><span>Enviar</span>';

  // Agregar elementos al formulario

  form.appendChild(recieverInput);
  form.appendChild(excludeLabel);
  form.appendChild(regaloInput);
  form.appendChild(submitButton);

  subscribeForm(form);
  // Agregar formulario a la tabla
  tdform.appendChild(form);
  tabla.appendChild(trform);

  // Agregar tabla al contenedor (guestbook)
  guestbook.appendChild(tabla);
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
      userID: auth.currentUser.uid,
    });

    // Clear message input field
    regaloInput.value = '';

    // Return false to avoid redirect (not necessary with preventDefault)
    // return false;
  });
}
