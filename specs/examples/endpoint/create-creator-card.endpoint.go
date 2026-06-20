CreateCreatorCardRequest {
  path /creator-cards
  method POST

  body {
    title string<trim|lengthBetween:3,100>
    description? string<trim|maxLength:500>
    slug? string<trim|lengthBetween:5,50>
    creator_reference string<trim|length:20>
    status string<trim>(draft|published)
    access_type? string<trim>(public|private)
    access_code? string<trim>

    links[]? {
      title string<trim|lengthBetween:1,100>
      url string<trim|maxLength:200>
    }

    service_rates? {
      currency string<trim>(NGN|USD|GBP|GHS)
      rates[] {
        name string<trim|lengthBetween:3,100>
        description string<trim|maxLength:250>
        amount integer<min:1>
      }
    }
  }

  response.ok {
    http.code 200
    status successful
    message "Creator Card Created Successfully."
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
      deleted? number
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

  response.slug_taken {
    http.code 400
    status error
    message "Slug is already taken"
    code string(SL02)
    data {}
  }

  response.private_access_code_required {
    http.code 400
    status error
    message "access_code is required when access_type is private"
    code string(AC01)
    data {}
  }

  response.public_access_code_not_allowed {
    http.code 400
    status error
    message "access_code cannot be set on public creator cards"
    code string(AC05)
    data {}
  }
}
