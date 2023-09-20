interface IStudent {
    name: string,
    surname: string,
    email: string,
}

interface IGradedStudent extends IStudent {
    grade: number
}
