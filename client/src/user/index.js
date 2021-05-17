class User {
  constructor(id, name, isLocal) {
    this.id = id;
    this.name = name;
    this.isLocal = isLocal
  }

  getName() {
    return this.name
  }

  getId() {
    return this.id
  }

  getIsLocal() {
    return this.isLocal
  }
}

export default User;
