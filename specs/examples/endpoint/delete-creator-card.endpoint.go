DeleteCreatorCardRequest {
  path /creator-cards/:slug
  method DELETE

  params {
    slug string<trim|lengthBetween:5,50>
  }

  body {
    creator_reference string<trim|length:20>
  }

  response.ok {
    http.code 200
    status successful
    message "Creator Card Deleted Successfully."
    data {
      id string<length:26>
      title string
      description? string
      slug string
      creator_reference string
      status string
      access_type string
      access_code? string
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
      deleted number
      created number
      updated number
    }
  }

  response.validation_error {
    http.code 400
    status error
    message "Validation failed"
    code string(VALIDATION_ERROR)
    data {}
  }

  response.not_found {
    http.code 404
    status error
    message "Creator card not found"
    code string(NF01)
    data {}
  }
}
