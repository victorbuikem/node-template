RetrieveCreatorCardRequest {
  path /creator-cards/:slug
  method GET

  params {
    slug string<trim|lengthBetween:5,50>
  }

  query {
    access_code? string<trim>
  }

  response.ok {
    http.code 200
    status successful
    message "Creator Card Retrieved Successfully."
    data {
      id string<length:26>
      title string
      description? string
      slug string
      creator_reference string
      status string
      access_type string
      links[]? {
        title string
        url string
      }
      service_rates? {
        currency string
        rates[] {
          name string
          description string
          amount integer
        }
      }
      deleted? number
      created number
      updated number
    }
  }

  response.private_access_code_missing {
    http.code 403
    status error
    message "access_code is required to retrieve this creator card"
    code string(AC03)
    data {}
  }

  response.private_access_code_invalid {
    http.code 403
    status error
    message "Invalid access_code"
    code string(AC04)
    data {}
  }

  response.not_found {
    http.code 404
    status error
    message "Creator card not found"
    code string(NF01)
    data {}
  }

  response.draft_not_found {
    http.code 404
    status error
    message "Creator card not found"
    code string(NF02)
    data {}
  }
}
