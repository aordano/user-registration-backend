export type tableField = {
    column: string
    datatype: string
}

export type rowType = (string | number | boolean)[]

export type rowFields = {
    columns: string[]
    rows: rowType[]
}

export type set = {
    column: string
    data: string | number | null
}

export type rowFieldUpdate = {
    set: set[]
    where: set
}

export type selectQuery = {
    column: string
    data: string
    operator: "=" | "<>" | "!=" | "<" | ">" | "<=" | ">=" | ""
}

export type extraSelectQuery = {
    conditionType: "ALL" | "AND" | "ANY" | "BETWEEN" | "EXISTS" | "IN" | "LIKE" | "NOT" | "OR"
    conditionQuery: selectQuery
}

export type selectField = {
    columnsToSelect: string[]
    where: {
        query: selectQuery
        extraConditions?: extraSelectQuery[]
    }
}

export type callbackData = {
    error: Error
    result: Record<string, string | number | null | undefined>[]
    query: string
    data: selectField
}
