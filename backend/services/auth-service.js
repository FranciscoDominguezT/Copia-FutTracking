import AuthRepository from "../repositories/auth-repository.js";

export default class AuthService {
    loginAsync = async (entity) => {
        const repo = new AuthRepository();
        const returnArray = await repo.loginAsync(entity);
        return returnArray;
    }

    registerAsync = async (entity) => {
        const repo = new AuthRepository();
        const returnArray = await repo.registerAsync(entity);
        return returnArray;
    }
}