class ApiResponse {
    constructor(statusCode, data, token, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.token = token;
        this.message = message;
        this.success = statusCode < 400
    }
}

export default ApiResponse;