module MultiMain1 exposing (..)

import Browser
import Html exposing (button, div, h1, p, span, text)
import Html.Attributes exposing (id)
import Html.Events exposing (onClick)


main =
    Browser.sandbox
        { init = init
        , view = view
        , update = update
        }


type alias Model =
    { count : Int }


init : Model
init =
    { count = 0 }


type Msg
    = Increment


update msg model =
    case msg of
        Increment ->
            { model | count = model.count + 1 }


view model =
    div [ id "incrementer" ]
        [ h1 [] [ text "MultiMain1" ]
        , span [ id "code-version" ] [ text "code: inc-v1" ]
        , p []
            [ text "Counter value is: "
            , span [ id "counter-value" ] [ text (String.fromInt model.count) ]
            ]
        , button [ onClick Increment, id "counter-button" ] [ text "+" ]
        ]
