from backend import crud

def test_read_user_me(client, mock_current_user, mock_github_crud):
    # Should work because we override the dependency
    response = client.get("/api/user/me")
    assert response.status_code == 200
    data = response.json()
    assert "username" in data
    assert data["username"] == "testuser"

def test_read_user_by_username(client, db):
    # Setup - add user directly to DB
    crud.create_user_if_not_exists(db, "target_user")

    response = client.get("/users/target_user")
    assert response.status_code == 200
    assert response.json()["username"] == "target_user"

def test_read_user_not_found(client, db):
    response = client.get("/users/nonexistent")
    assert response.status_code == 404
