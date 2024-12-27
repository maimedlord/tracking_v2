const API_URL_BASE = 'http://127.0.0.1:5000/api';

function is_all_digits(str) {
    return /^\d+$/.test(str);
}

function view_apply() {
    if (!VIEWS_OBJ) {
        console.log('VIEWS_OBJ is false');
        return;
    }
    let object_keys = Object.keys(VIEWS_OBJ);
    for (let i = 0; i < object_keys.length; i++) {
        let temp_doc = document.getElementById(object_keys[i]);
        // skip assigning value if id cannot be found
        if (temp_doc) {
            temp_doc.value = VIEWS_OBJ[object_keys[i]];
            temp_doc.dataset.view_config = VIEWS_OBJ[object_keys[i]];
        }
    }
}

async function view_configs_get(target) {
    try {
        let url = API_URL_BASE + '/view_get/' + target
        // Make an asynchronous GET request to the API
        const response = await fetch(url, {method: 'GET'});
        // Check if the response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        VIEWS_OBJ = data.data;
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: get_view_configs(): ", error);
    }
}

async function view_update(view_obj) {
    try {
        let url = API_URL_BASE + '/view_update/' + JSON.stringify(view_obj);
        // make asynchronous POST request to the API
        const response = await fetch(url, {method: 'GET'});
        // check if response was successful
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        // Parse the JSON data from the response
        const data = await response.json();
        if (data.status !== 200) {
            console.log('view_update: ' + data.statusCode);
        }
    } catch (error) {
        // Handle errors
        console.error("There was an error with the fetch request: view_update: ", error);
    }
}
