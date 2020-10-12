/**
 * * --------------------->>
 * * Imports
 * * --------------------->>
 */

import { expect } from "chai"
import { Request } from "express"
import { readFileSync } from "fs"
import { resolve } from "path"
import * as Types from "../../../src/types"
import { parseRequestData } from "../../../src/utils/functions"

/**
 * * ------------------------------------------>>
 * * Generate valid JSON objects for the tables
 * * ------------------------------------------>>
 */

const leadsTable: Types.tableField[] = JSON.parse(
    readFileSync(resolve(__dirname, "../../../db/tables/leads.json")).toString()
)

const membershipApplicantsTable: Types.tableField[] = JSON.parse(
    readFileSync(resolve(__dirname, "../../../db/tables/membership_applicants.json")).toString()
)

/**
 * * ------------------------------------------>>
 * * Mock requests
 * * ------------------------------------------>>
 */

const mockValidLeadsRequest = ({
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "query-kind": "leadgen",
    },
    body: {
        name: "Harold",
        organization: "The Chickpea Coalition",
        role: "Chickpea Manager",
        email: "totallyNotAMicrosoftReference@contoso.com",
        mailing_list: 1,
        membership_interest: 1,
        message: "Look Ma, text!",
    },
} as unknown) as Request

const mockInvalidTypesLeadsRequest = ({
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "query-kind": "leadgen",
    },
    body: {
        name: 1,
        organization: 1,
        role: 1,
        email: 1,
        mailing_list: "nope",
        membership_interest: "nope",
        message: 1,
    },
} as unknown) as Request

const mockMissingKeyFieldsLeadsRequest = ({
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "query-kind": "leadgen",
    },
    body: {
        role: "Chickpea Manager",
        mailing_list: 1,
        membership_interest: 1,
        message: "Look Ma, text!",
    },
} as unknown) as Request

const mockProtectedFieldsLeadsRequest = ({
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "query-kind": "leadgen",
    },
    body: {
        name: "Harold",
        organization: "The Chickpea Coalition",
        role: "Chickpea Manager",
        email: "totallyNotAMicrosoftReference@contoso.com",
        mailing_list: 1,
        membership_interest: 1,
        message: "Look Ma, text!",
        verification_token: "abcdef",
        autokey: 255,
    },
} as unknown) as Request

const mockExtraFieldsLeadsRequest = ({
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "query-kind": "leadgen",
    },
    body: {
        name: "Harold",
        organization: "The Chickpea Coalition",
        role: "Chickpea Manager",
        email: "totallyNotAMicrosoftReference@contoso.com",
        nutella: "glorious",
        mailing_list: 1,
        membership_interest: 1,
        message: "Look Ma, text!",
        chocolate: "tasty",
        cars: "vroom vroom",
    },
} as unknown) as Request

const mockScrambledValidLeadsRequest = ({
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "query-kind": "leadgen",
    },
    body: {
        membership_interest: 1,
        message: "Look Ma, text!",
        organization: "The Chickpea Coalition",
        email: "totallyNotAMicrosoftReference@contoso.com",
        name: "Harold",
        role: "Chickpea Manager",
        mailing_list: 1,
    },
} as unknown) as Request

/**
 * * ------------------------------------------>>
 * * Mock parsed table data
 * * ------------------------------------------>>
 */

const leadsColumns = [
    "name",
    "organization",
    "role",
    "email",
    "mailing_list",
    "membership_interest",
    "message",
    "verification_token",
    "autokey",
]

const specificValidLeadsData = {
    columns: leadsColumns,
    rows: [
        "Harold",
        "The Chickpea Coalition",
        "Chickpea Manager",
        "totallyNotAMicrosoftReference@contoso.com",
        1,
        1,
        "Look Ma, text!",
        undefined,
        undefined,
    ],
}

const missingFieldsLeadsData = {
    columns: leadsColumns,
    rows: [
        undefined,
        undefined,
        "Chickpea Manager",
        undefined,
        1,
        1,
        "Look Ma, text!",
        undefined,
        undefined,
    ],
}

const invalidTypesLeadsData = {
    columns: leadsColumns,
    rows: [
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
    ],
}

/**
 * * ---------------------->>
 * * Tests
 * * ---------------------->>
 */
describe("parseRequestData unit testing", function () {
    it("Should process valid data correctly", function () {
        expect(JSON.stringify(parseRequestData(mockValidLeadsRequest, leadsTable))).to.equal(
            JSON.stringify(specificValidLeadsData)
        )
    })

    it("Should discard data from the wrong types", function () {
        expect(JSON.stringify(parseRequestData(mockInvalidTypesLeadsRequest, leadsTable))).to.equal(
            JSON.stringify(invalidTypesLeadsData)
        )
    })

    it("Should not write to protected fields", function () {
        expect(
            JSON.stringify(parseRequestData(mockProtectedFieldsLeadsRequest, leadsTable))
        ).to.equal(JSON.stringify(specificValidLeadsData))
    })

    it("Should ignore fields not present on the table definition file", function () {
        expect(JSON.stringify(parseRequestData(mockExtraFieldsLeadsRequest, leadsTable))).to.equal(
            JSON.stringify(specificValidLeadsData)
        )
    })

    it("Should work with scrambled data", function () {
        expect(
            JSON.stringify(parseRequestData(mockScrambledValidLeadsRequest, leadsTable))
        ).to.equal(JSON.stringify(specificValidLeadsData))
    })

    it("Should ignore missing fields", function () {
        expect(
            JSON.stringify(parseRequestData(mockMissingKeyFieldsLeadsRequest, leadsTable))
        ).to.equal(JSON.stringify(missingFieldsLeadsData))
    })

    // TODO Add test for missing fields
})
