
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
// 4. HANDLE FORM SUBMISSION
// ==========================================

surveyForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    // Validate Q2 and Q12

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


    // Questions that allow multiple selections

    const checkboxGroups = [
        "struggles",
        "for-delivery-service",
        "current-method",
        "barriers"
    ];


    // Convert form data into an object

    for (const [name, value] of formData.entries()) {

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
    // 5. SEND RESPONSES TO SUPABASE
    // ======================================

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {

        const { error } = await supabaseClient
            .from("Survey_Response")
            .insert([
                { responses: responses }
            ]);


        if (error) {
            console.error("Submission failed:", error);

            alert(
                "Something went wrong while submitting your response. Please try again."
            );

            return;
        }


        // ==================================
        // 6. SUCCESSFUL SUBMISSION
        // ==================================

        alert(
            "Thank you! Your response has been submitted successfully."
        );

        surveyForm.reset();


        // Hide the two Other input fields after resetting

        document.getElementById(
            "other-needs-container"
        ).hidden = true;

        document.getElementById(
            "other-barrier-container"
        ).hidden = true;


        // Remove their required status

        document.getElementById(
            "other-needs-text"
        ).required = false;

        document.getElementById(
            "other-barrier-text"
        ).required = false;


    } catch (error) {

        console.error("Unexpected error:", error);

        alert(
            "Unable to submit your response. Please check your internet connection and try again."
        );

    } finally {

        // Allow another submission

        submitButton.disabled = false;

        submitButton.innerHTML =
            'Submit Survey <span>→</span>';

    }

});
