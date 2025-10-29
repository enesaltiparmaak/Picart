import requests
import sys
import json
from datetime import datetime

class PicEditorAPITester:
    def __init__(self, base_url="https://piceditor-27.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.project_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_signup(self, username, email, password):
        """Test user signup"""
        success, response = self.run_test(
            "User Signup",
            "POST",
            "api/auth/signup",
            200,
            data={"username": username, "email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_login(self, username, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_current_user(self):
        """Test get current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "api/auth/me",
            200
        )
        return success

    def test_create_project(self, title="Test Project"):
        """Test project creation"""
        success, response = self.run_test(
            "Create Project",
            "POST",
            "api/projects",
            200,
            data={
                "title": title,
                "canvas_data": {"objects": []},
                "width": 800,
                "height": 600
            }
        )
        if success and 'id' in response:
            self.project_id = response['id']
            return True
        return False

    def test_get_projects(self):
        """Test get user projects"""
        success, response = self.run_test(
            "Get User Projects",
            "GET",
            "api/projects",
            200
        )
        return success

    def test_get_project(self):
        """Test get specific project"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
        
        success, response = self.run_test(
            "Get Specific Project",
            "GET",
            f"api/projects/{self.project_id}",
            200
        )
        return success

    def test_update_project(self):
        """Test project update"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
        
        success, response = self.run_test(
            "Update Project",
            "PUT",
            f"api/projects/{self.project_id}",
            200,
            data={
                "title": "Updated Test Project",
                "canvas_data": {"objects": [{"type": "text", "text": "Hello World"}]}
            }
        )
        return success

    def test_file_upload(self):
        """Test file upload"""
        # Create a simple test image data
        import base64
        from io import BytesIO
        
        # Create a minimal PNG image (1x1 pixel)
        png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==')
        
        files = {'file': ('test.png', BytesIO(png_data), 'image/png')}
        
        success, response = self.run_test(
            "File Upload",
            "POST",
            "api/upload",
            200,
            files=files
        )
        return success

    def test_get_templates(self):
        """Test get templates"""
        success, response = self.run_test(
            "Get Templates",
            "GET",
            "api/templates",
            200
        )
        return success

    def test_export_project(self):
        """Test project export"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
        
        success, response = self.run_test(
            "Export Project",
            "POST",
            f"api/projects/{self.project_id}/export",
            200,
            data={"format": "png", "quality": 90}
        )
        return success

    def test_delete_project(self):
        """Test project deletion"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
        
        success, response = self.run_test(
            "Delete Project",
            "DELETE",
            f"api/projects/{self.project_id}",
            200
        )
        return success

def main():
    # Setup
    tester = PicEditorAPITester()
    test_user = f"testuser_{datetime.now().strftime('%H%M%S')}"
    test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
    test_password = "TestPass123!"

    print("🚀 Starting PicEditor API Tests")
    print(f"Base URL: {tester.base_url}")
    print(f"Test User: {test_user}")

    # Test health check first
    if not tester.test_health_check():
        print("❌ Health check failed, stopping tests")
        return 1

    # Test authentication flow
    if not tester.test_signup(test_user, test_email, test_password):
        print("❌ Signup failed, trying login with existing user")
        if not tester.test_login(test_user, test_password):
            print("❌ Both signup and login failed, stopping tests")
            return 1

    # Test user info
    if not tester.test_get_current_user():
        print("❌ Get current user failed")

    # Test project management
    if not tester.test_create_project():
        print("❌ Project creation failed")
        return 1

    if not tester.test_get_projects():
        print("❌ Get projects failed")

    if not tester.test_get_project():
        print("❌ Get specific project failed")

    if not tester.test_update_project():
        print("❌ Update project failed")

    # Test file upload
    if not tester.test_file_upload():
        print("❌ File upload failed")

    # Test templates
    if not tester.test_get_templates():
        print("❌ Get templates failed")

    # Test export
    if not tester.test_export_project():
        print("❌ Export project failed")

    # Test deletion (last)
    if not tester.test_delete_project():
        print("❌ Delete project failed")

    # Print results
    print(f"\n📊 Test Results:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())