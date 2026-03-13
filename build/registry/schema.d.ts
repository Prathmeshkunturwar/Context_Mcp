export interface ValidationError {
    libraryIndex: number;
    libraryId: string;
    field: string;
    message: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    libraryCount: number;
}
export declare function validateRegistry(registryPath?: string): ValidationResult;
