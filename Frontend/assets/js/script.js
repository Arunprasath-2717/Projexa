// Update the 'PRODUCTION_URL' once you've deployed your backend to Render.
const PRODUCTION_URL = "https://projexa-6m8h.onrender.com"; 
const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? "http://127.0.0.1:5000"
    : PRODUCTION_URL;

const form = document.getElementById("submissionForm");
const SUBMIT_URL = API_BASE + "/submit";

let isSubmitting = false;
let successShown = false;

const steps = document.querySelectorAll(".step");

const contents = document.querySelectorAll(".step-content");
const progressFill = document.querySelector(".progress-fill");

const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");

let current = 0;

function updateUI(direction) {
    // Update Stepper visually
    steps.forEach((step, i) => {
        step.classList.remove("active", "completed");
        if (i < current) {
            step.classList.add("completed");
        }
        if (i === current) {
            step.classList.add("active");
        }
    });

    // Update Progress Bar
    const progressPercentage = (current / (steps.length - 1)) * 100;
    progressFill.style.width = `${progressPercentage}%`;

    // Lock pointer events during transition to prevent rapid clicking/scrolling issues
    document.body.style.pointerEvents = "none";
    setTimeout(() => {
        document.body.style.pointerEvents = "auto";
    }, 500);

    // Handle 3D Cinematic Transitions
    contents.forEach((content, i) => {
        if (content.classList.contains("active")) {
            content.classList.remove("active");
            // Add exit animations based on direction
            if (direction === 'next') {
                content.classList.add("exiting");
            } else if (direction === 'prev') {
                content.classList.add("exiting-backward");
            }

            // Allow the exit animation to process before purely hiding
            setTimeout(() => {
                content.classList.remove("exiting", "exiting-backward");
            }, 500);
        }
    });

    // Activate new panel after short delay for cinematic pop-in effect
    setTimeout(() => {
        contents.forEach((content, i) => {
            if (i === current) {
                content.classList.add("active");
            }
        });
    }, 150);

    // Handle Buttons logic
    if (current === 0) {
        backBtn.classList.add("hidden");
        nextBtn.classList.remove("hidden");
        submitBtn.classList.add("hidden");
    } else if (current === steps.length - 1) {
        backBtn.classList.remove("hidden");
        nextBtn.classList.add("hidden");
        submitBtn.classList.remove("hidden");
    } else {
        backBtn.classList.remove("hidden");
        nextBtn.classList.remove("hidden");
        submitBtn.classList.add("hidden");
    }
}

// --- Toggle Logic for Journal & Review Details ---
const paperPublishedSelect = document.querySelector('select[name="paper_published"]');
if (paperPublishedSelect) {
    paperPublishedSelect.addEventListener('change', toggleConditionalFields);
}

function toggleConditionalFields() {
    const status = paperPublishedSelect.value;
    const isNo = (status === "No");
    
    // Journal and Review fields to disable entirely if No
    const fullDisableFields = [
        document.querySelector('input[name="journal_name"]'),
        document.querySelector('input[name="isbn_no"]'),
        document.querySelector('select[name="journal_type"]'),
        document.querySelector('select[name="review_status"]'),
        document.querySelector('select[name="report_submission"]'),
        document.querySelector('input[name="file"]') // Disable report upload
    ];
    
    // Mark fields: Only Sem 3 is affected by publication status
    const marksConfig = [
        { name: 'ee_sem1_mark', isManaged: false },
        { name: 'ee_sem2_mark', isManaged: false },
        { name: 'ee_sem3_mark', isManaged: true }
    ];

    // Handle Full Disable Group
    fullDisableFields.forEach(field => {
        if (field) {
            handleFieldState(field, isNo);
        }
    });

    // Handle Marks Individually
    marksConfig.forEach(config => {
        const field = document.querySelector(`input[name="${config.name}"]`);
        if (field) {
            handleFieldState(field, config.isManaged ? isNo : false);
        }
    });
}

function handleFieldState(field, shouldDisable) {
    field.disabled = shouldDisable;
    field.required = !shouldDisable;
    
    const group = field.closest('.input-group');
    if (group) {
        group.style.opacity = shouldDisable ? "0.4" : "1";
        group.style.pointerEvents = shouldDisable ? "none" : "auto";
        
        const label = group.querySelector('label');
        if (label) {
            // Initialize original text if not present to prevent vanishing
            if (!label.hasAttribute('data-orig')) {
                label.setAttribute('data-orig', label.textContent.trim().replace(/\s?\*$/, '').replace(' (N/A)', ''));
            }
            const base = label.getAttribute('data-orig');
            label.textContent = base + (shouldDisable ? ' (N/A)' : ' *');
        }
    }
    if (shouldDisable) field.value = ""; // Clear values if disabled to avoid stale data
}

function showError(input, message) {
    let errorMsg = input.parentElement.querySelector('.error-msg');
    if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-msg';
        input.parentElement.appendChild(errorMsg);
    }
    errorMsg.innerText = message;
    errorMsg.style.display = 'block';
    input.classList.add('input-error');

    // Listen for input to clear error
    const clearOnInput = () => {
        errorMsg.style.display = 'none';
        input.classList.remove('input-error');
        input.removeEventListener('input', clearOnInput);
    };
    input.addEventListener('input', clearOnInput);
}

function clearErrors(content) {
    const errors = content.querySelectorAll('.error-msg');
    errors.forEach(err => err.style.display = 'none');
    const inputs = content.querySelectorAll('.input-error');
    inputs.forEach(inp => inp.classList.remove('input-error'));
}

function nextStep() {
    // Validate current step before moving
    const activeContent = contents[current];
    clearErrors(activeContent);

    const inputs = activeContent.querySelectorAll("input, select, textarea");
    let isValid = true;
    for (let input of inputs) {
        if (!input.checkValidity()) {
            isValid = false;
            let message = "This field is required.";
            if (input.validity.valueMissing) {
                message = "This field is required for your submission.";
            } else if (input.validity.patternMismatch) {
                message = input.title || "Please match the required format.";
            } else if (input.validity.typeMismatch) {
                message = "Please enter a valid format.";
            } else if (input.validity.rangeUnderflow || input.validity.rangeOverflow) {
                message = `Value must be between ${input.min} and ${input.max}.`;
            }
            showError(input, message);
        }
    }
    if (!isValid) return; // Prevent moving to next step if invalid

    if (current < contents.length - 1) {
        // Scroll to top of container smoothly if needed
        window.scrollTo({
            top: document.querySelector('.container').offsetTop - 50,
            behavior: 'smooth'
        });
        current++;
        updateUI('next');
    }
}

function prevStep() {
    if (current > 0) {
        window.scrollTo({
            top: document.querySelector('.container').offsetTop - 50,
            behavior: 'smooth'
        });
        current--;
        updateUI('prev');
    }
}

// Prevent any native form submission (safety net)
form.addEventListener('submit', function (e) {
    e.preventDefault();
    return false;
});

async function handleSubmit() {
    // Validate the current (last) step before submitting
    const activeContent = contents[current];
    clearErrors(activeContent);
    const inputs = activeContent.querySelectorAll("input, select, textarea");
    let isValid = true;
    for (let input of inputs) {
        if (!input.checkValidity()) {
            isValid = false;
            let message = "This field is required.";
            if (input.validity.valueMissing) {
                message = "This field is required for your submission.";
            } else if (input.validity.patternMismatch) {
                message = input.title || "Please match the required format.";
            } else if (input.validity.typeMismatch) {
                message = "Please enter a valid format.";
            }
            showError(input, message);
        }
    }
    if (!isValid) return;

    if (isSubmitting) return;
    isSubmitting = true;

    const submitBtn = document.getElementById("submitBtn");
    const backBtn = document.getElementById("backBtn");
    const originalContent = submitBtn.innerHTML;

    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    backBtn.disabled = true;
    try {
        const formData = new FormData(form);
        const response = await fetch(SUBMIT_URL, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            triggerSuccess();
        } else {
            const errorData = await response.json();
            alert("Error: " + (errorData.error || "Submission failed on the server."));
            isSubmitting = false;
            submitBtn.innerHTML = originalContent;
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            backBtn.disabled = false;
        }
    } catch (error) {
        console.error('Submission Error:', error);
        alert('Connection error. Please ensure the backend server is running at http://127.0.0.1:5000');
        isSubmitting = false;
        submitBtn.innerHTML = originalContent;
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        backBtn.disabled = false;
    }
}

function triggerSuccess() {
    if (successShown) return;
    successShown = true;

    // 1) Fade out form elements quickly
    var toHide = [document.querySelector('.title'), document.querySelector('.stepper-wrapper'), document.querySelector('.buttons'), form];
    toHide.forEach(function(el) {
        if (el) {
            el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            el.style.opacity = '0';
            el.style.transform = 'translateY(-15px)';
        }
    });

    // 2) After fade-out completes, swap in success
    setTimeout(function() {
        toHide.forEach(function(el) { if (el) el.style.display = 'none'; });

        // Inject fresh SVG so CSS keyframe animations replay from scratch
        var box = document.getElementById('checkmarkBox');
        box.innerHTML = '<svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>';

        var ss = document.getElementById('successState');
        ss.classList.add('visible');
        ss.offsetHeight; // force reflow
        ss.classList.add('fade-in');

        document.querySelector('.glass-panel').style.minHeight = '450px';
        document.body.style.pointerEvents = 'auto';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
}

const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dropZoneContent = document.getElementById('dropZoneContent');
const dropZoneFile = document.getElementById('dropZoneFile');
const fileNameEl = document.getElementById('fileName');
const fileSizeEl = document.getElementById('fileSize');
const uploadProgressBar = document.getElementById('uploadProgressBar');
const removeFileBtn = document.getElementById('removeFileBtn');

if (fileInput && dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault(); e.stopPropagation();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault(); e.stopPropagation();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            fileInput.files = files; // Standard HTML5 property setter
            handleFileSelection(files[0]);
        }
    });

    fileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
            handleFileSelection(this.files[0]);
        }
    });

    removeFileBtn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        fileInput.value = '';
        dropZoneFile.classList.add('hidden');
        dropZoneContent.classList.remove('hidden');
    });

    function handleFileSelection(file) {
        if (file.type !== "application/pdf") {
            alert("Please upload a PDF file.");
            fileInput.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("File must be under 5MB");
            fileInput.value = '';
            return;
        }

        // Update UI details
        fileNameEl.textContent = file.name;
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
        fileSizeEl.textContent = `${sizeInMB} MB`;

        // Swap views
        dropZoneContent.classList.add('hidden');
        dropZoneFile.classList.remove('hidden');

        // Animate progress bar filling effect
        uploadProgressBar.style.width = '0%';
        setTimeout(() => uploadProgressBar.style.width = '42%', 150);
        setTimeout(() => uploadProgressBar.style.width = '100%', 450);
    }
}

let nextWeek = 1;
function addWeek() {
    const container = document.getElementById('weekly-abstracts-container');
    const item = document.createElement('div');
    item.className = 'weekly-abstract-item';
    item.style = 'margin-bottom: 24px; padding: 20px; background: rgba(255,255,255,0.4); border-radius: 16px; border: 1px solid rgba(0,0,0,0.05); animation: fadeIn 0.4s ease;';
    item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="font-size: 16px; color: var(--primary);">Week ${nextWeek}</h3>
            <button type="button" onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #ef4444; cursor: pointer; padding: 5px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="input-group">
            <label>Weekly Abstract PDF *</label>
            <input type="file" name="weekly_abstract_${nextWeek}" accept="application/pdf" required>
        </div>
    `;
    container.appendChild(item);
    nextWeek++;
    document.getElementById('add-week-btn').innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Next Week (Week ${nextWeek})
    `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateUI('init');
    if (paperPublishedSelect) {
        toggleConditionalFields();
    }
});
