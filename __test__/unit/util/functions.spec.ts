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
        name: "full name",
        organization: "new garbanzos solidarios",
        role: "Chickpea Manager",
        email: "bla@bla.com",
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

/**
 * * ------------------------------------------>>
 * * Mock parsed table data
 * * ------------------------------------------>>
 */

const specificValidLeadsData = {
    columns: [
        "name",
        "organization",
        "role",
        "email",
        "mailing_list",
        "membership_interest",
        "message",
        "verification_token",
        "autokey",
    ],
    rows: [
        "full name",
        "new garbanzos solidarios",
        "Chickpea Manager",
        "bla@bla.com",
        1,
        1,
        "Look Ma, text!",
        undefined,
        undefined,
    ],
}

const invalidTypesLeadsData = {
    columns: [
        "name",
        "organization",
        "role",
        "email",
        "mailing_list",
        "membership_interest",
        "message",
        "verification_token",
        "autokey",
    ],
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
        expect(parseRequestData(mockValidLeadsRequest, leadsTable).toString()).to.equal(
            specificValidLeadsData.toString()
        )
    })

    it("Should discard data from the wrong types", function () {
        expect(parseRequestData(mockInvalidTypesLeadsRequest, leadsTable).toString()).to.equal(
            invalidTypesLeadsData.toString()
        )
    })

    // TODO Add test to not write invalid fields

    // TODO Add test to not write protected columns data if it's included in the body
})
