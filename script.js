
// ==========================================
// 1. DYNAMIC OTHER INPUTS
// ==========================================

function setupOtherInput(checkboxId, containerId, textInputId) {
    const checkbox = document.getElementById(checkboxId);
    const container = document.getElementById(containerId);
    const textInput = document.getElementById(textInputId);

    checkbox.addEventListener("change", function () {
        container.hidden = !checkbox.checked;
        textInput.required = checkbox.checked;

        if (!checkbox.checked) {
            textInput.value = "";
        }
    });
}

setupOtherInput(
    "other-needs",
    "other-needs-container",
    "other-needs-text"
);

setupOtherInput(
    "other-barrier",
    "other-barrier-container",
    "other-barrier-text"
);


// ==========================================
// 2. SUPABASE CONNECTION
// ==========================================

const SUPABASE_URL = "https://hgyoounjfpwtpryhszkh.supabase.co";

// Keep your existing publishable key here.
// Do not replace it with your Turnstile key.
const SUPABASE_KEY = "sb_publishable_-d5mr7JkkQigjKuTTZJARg_XYpM-bk3";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ==========================================
// 3. SELECT THE FORM
// ==========================================

const surveyForm = document.querySelector(".survey-form");

const submitButton = surveyForm.querySelector(
    'button[type="submit"]'
);


// ==========================================
// 4. THANK-YOU MESSAGE
// ==========================================

function showThankYouMessage() {

    // Prevent duplicate thank-you messages
    if (document.querySelector(".already-submitted")) {
        return;
    }

    // Hide the survey
    surveyForm.hidden = true;

    // Create thank-you message
    const message = document.createElement("div");

    message.className = "already-submitted";

    message.innerHTML = `
        <h2>Thank You!</h2>

        <p>Your response has been recorded.</p>

        <p>
            We appreciate you helping us make
            SuperFast better for UNILORIN students.
        </p>
    `;

    surveyForm.parentElement.insertBefore(
        message,
        surveyForm
    );
}


// ==========================================
// 5. CHECK PREVIOUS SUBMISSION
// ==========================================

const submissionKey = "superfast_survey_submitted";

if (localStorage.getItem(submissionKey) === "true") {
    showThankYouMessage();
}


// ==========================================
// 6. HANDLE FORM SUBMISSION
// ==========================================

surveyForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    // Validate checkbox groups

    const requiredGroups = [
        "struggles",
        "barriers"
    ];

    for (const group of requiredGroups) {

        const checkboxes = surveyForm.querySelectorAll(
            `input[name="${group}"]`
        );

        const hasSelection = [...checkboxes].some(
            checkbox => checkbox.checked
        );

        if (!hasSelection) {

            alert(
                `Please select at least one option for ${
                    group === "struggles"
                        ? "Question 2"
                        : "Question 12"
                }.`
            );

            return;
        }
    }


    // Collect form answers

    const formData = new FormData(surveyForm);

    const responses = {};

    const checkboxGroups = [
        "struggles",
        "for-delivery-service",
        "current-method",
        "barriers"
    ];


    // Get Turnstile token

    const turnstileToken = formData.get(
        "cf-turnstile-response"
    );

    if (!turnstileToken) {

        alert("Please complete the security verification.");

        return;
    }


    // Convert form data into an object

    for (const [name, value] of formData.entries()) {

        if (name === "cf-turnstile-response") {
            continue;
        }

        if (checkboxGroups.includes(name)) {

            if (!responses[name]) {
                responses[name] = [];
            }

            responses[name].push(value);

        } else {

            responses[name] = value;

        }
    }


    // ======================================
    // 7. SEND TO EDGE FUNCTION
    // ======================================

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {

        const { error } = await supabaseClient.functions.invoke(
            "submit-survey",
            {
                body: {
                    responses,
                    turnstileToken
                }
            }
        );

        if (error) {
            console.error("Submission failed:", error);
            throw error;
        }


        // Save successful submission

        localStorage.setItem(submissionKey, "true");


        // Display thank-you message

        showThankYouMessage();


    } catch (error) {

        console.error("Unexpected error:", error);

        alert(
            "Unable to submit your response. Please try again."
        );

        window.turnstile?.reset();

    } finally {

        submitButton.disabled = false;

        submitButton.innerHTML =
            'Submit Survey <span>→</span>';

    }

});
