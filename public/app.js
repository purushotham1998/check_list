const API = window.location.origin;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const loginUsername = document.getElementById('login-username');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

const form = document.getElementById('record-form');
const submitBtn = document.getElementById('submit-btn');
const successMessage = document.getElementById('success-message');
const newEntryBtn = document.getElementById('new-entry-btn');
const fileInput = document.getElementById('id_proof');
const photoFileInput = document.getElementById('photo_proof');
const locationSelect = document.getElementById('preferred_location');
const locationOtherInput = document.getElementById('preferred_location_other');
const uploadZone = document.getElementById('upload-zone');
const uploadPlaceholder = document.getElementById('upload-placeholder');
const uploadPreview = document.getElementById('upload-preview');
const previewContent = document.getElementById('preview-content');
const previewFilename = document.getElementById('preview-filename');
const btnRemoveFile = document.getElementById('btn-remove-file');
const fileError = document.getElementById('file-error');
const photoUploadZone = document.getElementById('photo-upload-zone');
const photoUploadPlaceholder = document.getElementById('photo-upload-placeholder');
const photoUploadPreview = document.getElementById('photo-upload-preview');
const photoPreviewContent = document.getElementById('photo-preview-content');
const photoPreviewFilename = document.getElementById('photo-preview-filename');
const photoBtnRemoveFile = document.getElementById('photo-btn-remove-file');
const photoFileError = document.getElementById('photo-file-error');

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const SESSION_MINUTES = 15;
const SESSION_MS = SESSION_MINUTES * 60 * 1000;
let sessionCheckInterval = null;

// --- Admin login with 15-minute session ---
function clearSession() {
  sessionStorage.removeItem('ud_logged_in');
  sessionStorage.removeItem('ud_logged_at');
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval);
    sessionCheckInterval = null;
  }
}

function setLoggedIn(loggedIn) {
  if (loggedIn) {
    authSection.hidden = true;
    mainSection.hidden = false;
    sessionStorage.setItem('ud_logged_in', '1');
    sessionStorage.setItem('ud_logged_at', String(Date.now()));
    if (sessionCheckInterval) clearInterval(sessionCheckInterval);
    sessionCheckInterval = setInterval(() => {
      const loggedAt = parseInt(sessionStorage.getItem('ud_logged_at') || '0', 10);
      if (Date.now() - loggedAt >= SESSION_MS) {
        clearSession();
        authSection.hidden = false;
        mainSection.hidden = true;
      }
    }, 60000);
  } else {
    clearSession();
    authSection.hidden = false;
    mainSection.hidden = true;
  }
}

// Do not restore session on refresh — user must log in again after refresh

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loginError.textContent = '';
  loginBtn.disabled = true;

  const user = (loginUsername.value || '').trim();
  const pass = loginPassword.value || '';

  setTimeout(() => {
    if (user === 'admin' && pass === 'admin') {
      setLoggedIn(true);
      loginUsername.value = '';
      loginPassword.value = '';
    } else {
      loginError.textContent = 'Invalid username or password.';
    }
    loginBtn.disabled = false;
  }, 400);
});

function setFileError(msg) {
  fileError.textContent = msg || '';
  fileInput.setCustomValidity(msg || '');
}

function showPreview(file, targetContent, targetPlaceholder, targetPreview, targetFilename, setErr) {
  const isImage = IMAGE_TYPES.includes(file.type);
  targetContent.innerHTML = '';
  targetFilename.textContent = file.name;
  if (isImage) {
    const img = document.createElement('img');
    img.alt = 'Preview';
    img.className = 'preview-img';
    const reader = new FileReader();
    reader.onload = () => { img.src = reader.result; };
    reader.readAsDataURL(file);
    targetContent.appendChild(img);
  } else {
    const icon = document.createElement('div');
    icon.className = 'preview-pdf-icon';
    icon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg><span>PDF</span>';
    targetContent.appendChild(icon);
  }
  targetPlaceholder.hidden = true;
  targetPreview.hidden = false;
  if (setErr) setErr('');
}

function clearFilePreview() {
  fileInput.value = '';
  uploadPlaceholder.hidden = false;
  uploadPreview.hidden = true;
  previewContent.innerHTML = '';
  setFileError('');
}

function clearPhotoPreview() {
  photoFileInput.value = '';
  photoUploadPlaceholder.hidden = false;
  photoUploadPreview.hidden = true;
  photoPreviewContent.innerHTML = '';
  photoFileError.textContent = '';
  photoFileInput.setCustomValidity('');
}

function setPhotoFileError(msg) {
  photoFileError.textContent = msg || '';
  photoFileInput.setCustomValidity(msg || '');
}

function handleFileSelect(file) {
  if (!file) return;
  if (file.size > MAX_FILE_SIZE) {
    setFileError('File too large. Max 5MB.');
    fileInput.value = '';
    return;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    setFileError('Use PDF, JPG or PNG only.');
    fileInput.value = '';
    return;
  }
  showPreview(file, previewContent, uploadPlaceholder, uploadPreview, previewFilename, setFileError);
}

function handlePhotoFileSelect(file) {
  if (!file) return;
  if (file.size > MAX_FILE_SIZE) {
    setPhotoFileError('File too large. Max 5MB.');
    photoFileInput.value = '';
    return;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    setPhotoFileError('Use PDF, JPG or PNG only.');
    photoFileInput.value = '';
    return;
  }
  showPreview(file, photoPreviewContent, photoUploadPlaceholder, photoUploadPreview, photoPreviewFilename, setPhotoFileError);
}

fileInput.addEventListener('change', () => handleFileSelect(fileInput.files[0]));
photoFileInput.addEventListener('change', () => handlePhotoFileSelect(photoFileInput.files[0]));

uploadZone.addEventListener('click', (e) => {
  if (e.target.closest('.btn-remove-file') || e.target.closest('.upload-preview')) return;
  if (!uploadPreview.hidden) return;
  fileInput.click();
});

photoUploadZone.addEventListener('click', (e) => {
  if (e.target.closest('.btn-remove-file') || e.target.closest('.upload-preview')) return;
  if (!photoUploadPreview.hidden) return;
  photoFileInput.click();
});

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (!uploadPreview.hidden) return;
  uploadZone.classList.add('upload-dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('upload-dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('upload-dragover');
  if (!uploadPreview.hidden) return;
  const file = e.dataTransfer?.files?.[0];
  if (file) handleFileSelect(file);
});

photoUploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (!photoUploadPreview.hidden) return;
  photoUploadZone.classList.add('upload-dragover');
});
photoUploadZone.addEventListener('dragleave', () => photoUploadZone.classList.remove('upload-dragover'));
photoUploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  photoUploadZone.classList.remove('upload-dragover');
  if (!photoUploadPreview.hidden) return;
  const file = e.dataTransfer?.files?.[0];
  if (file) handlePhotoFileSelect(file);
});

btnRemoveFile.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  clearFilePreview();
});
photoBtnRemoveFile.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  clearPhotoPreview();
});

// Preferred location: show/hide "Other" text input
locationSelect.addEventListener('change', () => {
  const isOther = locationSelect.value === 'other';
  locationOtherInput.hidden = !isOther;
  locationOtherInput.required = isOther;
  if (!isOther) locationOtherInput.value = '';
});

// Inline validation
function showError(field, message) {
  const wrap = field.closest('.field');
  const err = wrap.querySelector('.error');
  err.textContent = message || '';
  field.classList.toggle('invalid', !!message);
}

function clearErrors() {
  document.querySelectorAll('.error').forEach((e) => (e.textContent = ''));
  document.querySelectorAll('.invalid').forEach((e) => e.classList.remove('invalid'));
}

function getMobileNumber() {
  const raw = (form.mobile_number.value || '').trim();
  if (!raw) return '';
  return '+91 ' + raw.replace(/\s/g, '');
}

function validateForm() {
  clearErrors();
  let valid = true;
  const first = form.first_name.value.trim();
  const last = form.last_name.value.trim();
  const mobile = getMobileNumber();
  const age = form.age.value;
  const sex = form.querySelector('input[name="sex"]:checked');
  const locality = form.locality.value.trim();
  const timeFrom = form.preferred_time_from.value;
  const timeTo = form.preferred_time_to.value;
  const locationValue = locationSelect.value === 'other' ? locationOtherInput.value.trim() : locationSelect.value;

  if (!first) {
    showError(form.first_name, 'First name is required');
    valid = false;
  }
  if (!last) {
    showError(form.last_name, 'Last name is required');
    valid = false;
  }
  if (!mobile || mobile === '+91 ') {
    showError(form.mobile_number, 'Mobile number is required');
    valid = false;
  }
  if (!age || age < 1 || age > 120) {
    showError(form.age, 'Enter a valid age (1–120)');
    valid = false;
  }
  if (!sex) {
    const wrap = form.querySelector('.radio-group').closest('.field');
    wrap.querySelector('.error').textContent = 'Please select sex';
    valid = false;
  }
  if (!locality) {
    showError(form.locality, 'Locality is required');
    valid = false;
  }
  if (!timeFrom) {
    showError(form.preferred_time_from, 'Required');
    valid = false;
  }
  if (!timeTo) {
    showError(form.preferred_time_to, 'Required');
    valid = false;
  }
  if (timeFrom && timeTo && timeFrom >= timeTo) {
    showError(form.preferred_time_to, 'End date & time must be after start');
    valid = false;
  }
  if (!locationValue) {
    const target = locationSelect.value === 'other' ? locationOtherInput : locationSelect;
    showError(target, locationSelect.value === 'other' ? 'Please enter your area' : 'Please select preferred location');
    valid = false;
  }
  return valid;
}

function getPreferredLocation() {
  return locationSelect.value === 'other' ? locationOtherInput.value.trim() : locationSelect.value;
}

// Read file as base64
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  submitBtn.disabled = true;
  successMessage.hidden = true;

  let idProofData = null;
  let idProofFilename = null;
  let photoProofData = null;
  let photoProofFilename = null;
  const file = fileInput.files[0];
  if (file && file.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(file.type)) {
    try {
      idProofData = await readFileAsBase64(file);
      idProofFilename = file.name;
    } catch (err) {
      console.error(err);
    }
  }
  const photoFile = photoFileInput.files[0];
  if (photoFile && photoFile.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(photoFile.type)) {
    try {
      photoProofData = await readFileAsBase64(photoFile);
      photoProofFilename = photoFile.name;
    } catch (err) {
      console.error(err);
    }
  }

  const payload = {
    first_name: form.first_name.value.trim(),
    last_name: form.last_name.value.trim(),
    mobile_number: getMobileNumber(),
    age: Number(form.age.value),
    sex: form.querySelector('input[name="sex"]:checked').value,
    locality: form.locality.value.trim(),
    preferred_time_from: form.preferred_time_from.value,
    preferred_time_to: form.preferred_time_to.value,
    preferred_location: getPreferredLocation(),
    id_proof_data: idProofData,
    id_proof_filename: idProofFilename,
    photo_proof_data: photoProofData,
    photo_proof_filename: photoProofFilename,
  };

  try {
    const res = await fetch(`${API}/api/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save');
    }
    successMessage.hidden = false;
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    alert(err.message || 'Something went wrong. Please try again.');
  } finally {
    submitBtn.disabled = false;
  }
});

newEntryBtn.addEventListener('click', () => {
  successMessage.hidden = true;
  form.reset();
  clearFilePreview();
  clearPhotoPreview();
  clearErrors();
  locationOtherInput.hidden = true;
  locationOtherInput.value = '';
  locationOtherInput.required = false;
  form.mobile_number.value = '';
  form.first_name.focus();
});

form.addEventListener('reset', () => {
  setTimeout(() => {
    clearErrors();
    clearFilePreview();
    clearPhotoPreview();
    locationOtherInput.hidden = true;
    locationOtherInput.value = '';
    locationOtherInput.required = false;
    form.mobile_number.value = '';
  }, 0);
});
