# Postman Testing Guide for Instruction Sheet Management System

## Overview
This guide provides comprehensive testing instructions for all microservices in the Instruction Sheet Management System using Postman.

---

## 🚀 Prerequisites 

### 1. Running Services
Ensure all services are running:
- **Auth Service**: `http://localhost:3001`
- **User Service**: `http://localhost:3002`
- **Department Service**: `http://localhost:3003`
- **Sheet Service**: `http://localhost:3005`

### 2. Postman Setup
- Install Postman Desktop or use Postman Web
- Create a new workspace for this project
- Import the collection (if available) or create manually

---

## 🔧 Environment Setup

### Create Environment Variables
Create a new environment in Postman with these variables:

| Variable | Initial Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost` | Base URL for all services |
| `authPort` | `3001` | Auth service port |
| `userPort` | `3002` | User service port |
| `departmentPort` | `3003` | Department service port |
| `sheetPort` | `3005` | Sheet service port |
| `token` | *(empty)* | JWT token (auto-populated) |
| `userId` | *(empty)* | Current user ID (auto-populated) |
| `departmentId` | *(empty)* | Department ID for testing |
| `sheetId` | *(empty)* | Sheet ID for testing |

### Environment URLs
- Auth Service: `{{baseUrl}}:{{authPort}}/api/v1`
- User Service: `{{baseUrl}}:{{userPort}}/api/v1`
- Department Service: `{{baseUrl}}:{{departmentPort}}/api/v1`
- Sheet Service: `{{baseUrl}}:{{sheetPort}}/api/v1`

---

## 🔐 Authentication Service Testing

### Collection: Auth Service Tests

#### 1. Health Check
```http
GET {{baseUrl}}:{{authPort}}/health
```
**Expected Response**: `200 OK` with service health information

#### 2. Register User
```http
POST {{baseUrl}}:{{authPort}}/api/v1/auth/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "firstName": "Test",
  "lastName": "User",
  "role": "preparateur",
  "departmentId": "507f1f77bcf86cd799439011"
}
```

**Post-Response Script**:
```javascript
pm.test("Registration successful", function () {
    pm.response.to.have.status(201);
    const response = pm.response.json();
    pm.expect(response.message).to.eql("User registered successfully");
    pm.environment.set("userId", response.userId);
});
```

#### 3. Login User
```http
POST {{baseUrl}}:{{authPort}}/api/v1/auth/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Post-Response Script**:
```javascript
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    pm.expect(response.accessToken).to.exist;
    pm.environment.set("token", response.accessToken);
    pm.environment.set("userId", response.user.id);
});
```

#### 4. Get Profile (Protected Route)
```http
GET {{baseUrl}}:{{authPort}}/api/v1/auth/profile
Authorization: Bearer {{token}}
```

**Tests**:
```javascript
pm.test("Profile retrieved successfully", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    pm.expect(response.email).to.exist;
    pm.expect(response.role).to.exist;
});
```

#### 5. Refresh Token
```http
POST {{baseUrl}}:{{authPort}}/api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}
```

#### 6. Logout
```http
POST {{baseUrl}}:{{authPort}}/api/v1/auth/logout
Authorization: Bearer {{token}}
```

---

## 👥 User Service Testing

### Collection: User Service Tests

#### 1. Health Check
```http
GET {{baseUrl}}:{{userPort}}/health
```

#### 2. Get All Users
```http
GET {{baseUrl}}:{{userPort}}/api/v1/users
Authorization: Bearer {{token}}
```

**Query Parameters**:
- `page`: `1`
- `limit`: `10`
- `search`: `test`
- `role`: `preparateur`
- `isActive`: `true`

#### 3. Get User by ID
```http
GET {{baseUrl}}:{{userPort}}/api/v1/users/{{userId}}
Authorization: Bearer {{token}}
```

#### 4. Create User
```http
POST {{baseUrl}}:{{userPort}}/api/v1/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "NewPassword123!",
  "firstName": "New",
  "lastName": "User",
  "role": "validateur",
  "departmentId": "507f1f77bcf86cd799439011"
}
```

#### 5. Update User
```http
PUT {{baseUrl}}:{{userPort}}/api/v1/users/{{userId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "User",
  "role": "admin"
}
```

#### 6. Delete User (Soft Delete)
```http
DELETE {{baseUrl}}:{{userPort}}/api/v1/users/{{userId}}
Authorization: Bearer {{token}}
```

#### 7. Get Users by Department
```http
GET {{baseUrl}}:{{userPort}}/api/v1/users/department/{{departmentId}}
Authorization: Bearer {{token}}
```

#### 8. Get User Statistics
```http
GET {{baseUrl}}:{{userPort}}/api/v1/users/statistics
Authorization: Bearer {{token}}
```

---

## 🏢 Department Service Testing

### Collection: Department Service Tests

#### 1. Health Check
```http
GET {{baseUrl}}:{{departmentPort}}/health
```

#### 2. Get All Departments
```http
GET {{baseUrl}}:{{departmentPort}}/api/v1/departments
Authorization: Bearer {{token}}
```

**Query Parameters**:
- `page`: `1`
- `limit`: `10`
- `search`: `engineering`
- `isActive`: `true`

**Post-Response Script**:
```javascript
pm.test("Departments retrieved successfully", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    if (response.data.length > 0) {
        pm.environment.set("departmentId", response.data[0].id);
    }
});
```

#### 3. Get Department by ID
```http
GET {{baseUrl}}:{{departmentPort}}/api/v1/departments/{{departmentId}}
Authorization: Bearer {{token}}
```

#### 4. Create Department
```http
POST {{baseUrl}}:{{departmentPort}}/api/v1/departments
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Research & Development",
  "description": "Responsible for innovation and new product development",
  "manager": "60f7b1b3e1b3c4a5d8e9f0a1"
}
```

**Post-Response Script**:
```javascript
pm.test("Department created successfully", function () {
    pm.response.to.have.status(201);
    const response = pm.response.json();
    pm.environment.set("departmentId", response.id);
});
```

#### 5. Update Department
```http
PATCH {{baseUrl}}:{{departmentPort}}/api/v1/departments/{{departmentId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "description": "Updated: Responsible for innovation, research, and new product development"
}
```

#### 6. Delete Department (Soft Delete)
```http
DELETE {{baseUrl}}:{{departmentPort}}/api/v1/departments/{{departmentId}}
Authorization: Bearer {{token}}
```

#### 7. Get Department Statistics
```http
GET {{baseUrl}}:{{departmentPort}}/api/v1/departments/statistics
Authorization: Bearer {{token}}
```

#### 8. Add Employee to Department
```http
POST {{baseUrl}}:{{departmentPort}}/api/v1/departments/{{departmentId}}/employees/{{userId}}
Authorization: Bearer {{token}}
```

#### 9. Remove Employee from Department
```http
DELETE {{baseUrl}}:{{departmentPort}}/api/v1/departments/{{departmentId}}/employees/{{userId}}
Authorization: Bearer {{token}}
```

#### 10. Get Departments by Manager
```http
GET {{baseUrl}}:{{departmentPort}}/api/v1/departments/manager/{{userId}}
Authorization: Bearer {{token}}
```

---

## 📋 Sheet Service Testing

### Collection: Sheet Service Tests

#### 1. Health Check
```http
GET {{baseUrl}}:{{sheetPort}}/health
```

#### 2. Get All Sheets
```http
GET {{baseUrl}}:{{sheetPort}}/api/v1/sheets
Authorization: Bearer {{token}}
```

**Query Parameters**:
- `page`: `1`
- `limit`: `10`
- `search`: `manual`
- `status`: `draft`
- `department`: `{{departmentId}}`
- `isActive`: `true`

**Post-Response Script**:
```javascript
pm.test("Sheets retrieved successfully", function () {
    pm.response.to.have.status(200);
    const response = pm.response.json();
    if (response.data.length > 0) {
        pm.environment.set("sheetId", response.data[0].id);
    }
});
```

#### 3. Get Sheet by ID
```http
GET {{baseUrl}}:{{sheetPort}}/api/v1/sheets/{{sheetId}}
Authorization: Bearer {{token}}
```

#### 4. Create Sheet
```http
POST {{baseUrl}}:{{sheetPort}}/api/v1/sheets
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Safety Procedures Manual",
  "reference": "SPM-2025-001",
  "description": "Comprehensive safety procedures for workplace operations",
  "department": "{{departmentId}}",
  "tags": ["safety", "procedures", "manual"],
  "filePath": "uploads/safety-manual.pdf",
  "encryptionIv": "testiv123456789",
  "originalFileName": "safety-manual.pdf",
  "mimeType": "application/pdf",
  "fileSize": 2048576
}
```

**Post-Response Script**:
```javascript
pm.test("Sheet created successfully", function () {
    pm.response.to.have.status(201);
    const response = pm.response.json();
    pm.environment.set("sheetId", response.id);
});
```

#### 5. Update Sheet
```http
PUT {{baseUrl}}:{{sheetPort}}/api/v1/sheets/{{sheetId}}
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "title": "Updated Safety Procedures Manual",
  "description": "Updated comprehensive safety procedures for workplace operations"
}
```

#### 6. Delete Sheet (Soft Delete)
```http
DELETE {{baseUrl}}:{{sheetPort}}/api/v1/sheets/{{sheetId}}
Authorization: Bearer {{token}}
```

#### 7. Get Sheet by Reference
```http
GET {{baseUrl}}:{{sheetPort}}/api/v1/sheets/reference/SPM-2025-001
Authorization: Bearer {{token}}
```

#### 8. Get Sheets by Department
```http
GET {{baseUrl}}:{{sheetPort}}/api/v1/sheets/department/{{departmentId}}
Authorization: Bearer {{token}}
```

#### 9. Get My Sheets
```http
GET {{baseUrl}}:{{sheetPort}}/api/v1/sheets/my-sheets
Authorization: Bearer {{token}}
```

#### 10. Validate Sheet
```http
PATCH {{baseUrl}}:{{sheetPort}}/api/v1/sheets/{{sheetId}}/validate
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "status": "approved",
  "comments": "Sheet approved after review"
}
```

#### 11. Get Sheet Statistics
```http
GET {{baseUrl}}:{{sheetPort}}/api/v1/sheets/statistics
Authorization: Bearer {{token}}
```

#### 12. Test Protected Route
```http
GET {{baseUrl}}:{{sheetPort}}/api/v1/sheets/test/me
Authorization: Bearer {{token}}
```

---

## 🧪 Testing Sequence

### Recommended Testing Order

1. **Authentication Flow**
   - Register a new user
   - Login to get JWT token
   - Test protected profile endpoint

2. **Department Management**
   - Create a department
   - Get department details
   - Update department information

3. **User Management**
   - Create additional users
   - Assign users to departments
   - Test user CRUD operations

4. **Sheet Management**
   - Create sheets linked to departments
   - Test sheet CRUD operations
   - Test sheet validation workflow

5. **Integration Testing**
   - Test cross-service data relationships
   - Verify JWT works across all services
   - Test error handling scenarios

---

## 📊 Test Scenarios

### Positive Test Cases
- ✅ Successful authentication
- ✅ CRUD operations for all entities
- ✅ Proper pagination and filtering
- ✅ JWT token validation
- ✅ Role-based access control

### Negative Test Cases
- ❌ Invalid credentials
- ❌ Expired JWT tokens
- ❌ Invalid input data
- ❌ Unauthorized access attempts
- ❌ Non-existent resource access

### Edge Cases
- 🔍 Empty result sets
- 🔍 Large data sets
- 🔍 Special characters in inputs
- 🔍 Concurrent operations
- 🔍 Network timeouts

---

## 📝 Test Documentation

### Test Results Template
For each test, document:
- **Test Name**: Clear description of what's being tested
- **Expected Result**: What should happen
- **Actual Result**: What actually happened
- **Status**: Pass/Fail
- **Notes**: Any observations or issues

### Common Test Assertions
```javascript
// Status code checks
pm.response.to.have.status(200);
pm.response.to.have.status(201);
pm.response.to.have.status(400);
pm.response.to.have.status(401);
pm.response.to.have.status(404);

// Response time checks
pm.expect(pm.response.responseTime).to.be.below(2000);

// Response structure checks
pm.expect(response.data).to.be.an('array');
pm.expect(response.pagination).to.exist;
pm.expect(response.id).to.exist;

// Data validation
pm.expect(response.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
pm.expect(response.role).to.be.oneOf(['admin', 'preparateur', 'validateur']);
```

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Authentication Issues
- **Problem**: "Authentication required" errors
- **Solution**: Ensure JWT token is properly set in environment variables
- **Check**: Token expiration (tokens expire after 15 minutes)

#### Connection Issues
- **Problem**: Service unavailable errors
- **Solution**: Verify all services are running on correct ports
- **Check**: Health check endpoints for each service

#### Data Issues
- **Problem**: "Not found" errors
- **Solution**: Ensure referenced IDs exist in the database
- **Check**: Use GET endpoints to verify data exists

#### Validation Issues
- **Problem**: "Bad Request" errors
- **Solution**: Check request body format and required fields
- **Check**: API documentation for correct data structure

---

## 📋 Checklist

### Pre-Testing Checklist
- [ ] All services are running
- [ ] MongoDB is connected
- [ ] Postman environment is configured
- [ ] JWT secret is properly set
- [ ] Health checks pass for all services

### Testing Checklist
- [ ] Authentication service tests pass
- [ ] User service tests pass
- [ ] Department service tests pass
- [ ] Sheet service tests pass
- [ ] Cross-service integration tests pass
- [ ] Error handling tests pass

### Post-Testing Checklist
- [ ] Test results documented
- [ ] Issues logged and tracked
- [ ] Performance metrics recorded
- [ ] Security vulnerabilities identified
- [ ] Recommendations for improvements

---

## 🔗 Additional Resources

- **Swagger Documentation**:
  - Auth Service: `http://localhost:3001/api/docs`
  - User Service: `http://localhost:3002/api/docs`
  - Department Service: `http://localhost:3003/api/docs`
  - Sheet Service: `http://localhost:3005/api/docs`

- **Health Check Endpoints**:
  - Auth Service: `http://localhost:3001/health`
  - User Service: `http://localhost:3002/health`
  - Department Service: `http://localhost:3003/health`
  - Sheet Service: `http://localhost:3005/health`

---

*Last Updated: July 7, 2025*
*Project: Instruction Sheet Management System*
*Testing Guide Version: 1.0*
