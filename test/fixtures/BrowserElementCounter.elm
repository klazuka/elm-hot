module BrowserElementCounter exposing (..)

import Browser
import Html exposing (button, div, text)
import Html.Attributes exposing (id)
import Html.Events exposing (onClick)


main =
    Browser.element { init = init, view = view, update = update, subscriptions = \_ -> Sub.none }



-- MODEL


type alias Flags =
    { n : Int }


type alias Model =
    Int


init : { n : Int } -> ( Int, Cmd Msg )
init flags =
    ( flags.n, Cmd.none )



-- UPDATE


type Msg
    = Increment
    | Decrement


update msg model =
    case msg of
        Increment ->
            ( model + 1, Cmd.none )

        Decrement ->
            ( model - 1, Cmd.none )



-- VIEW


view model =
    div []
        [ button [ onClick Decrement, id "button-minus" ] [ text "-" ]
        , div [ id "counter-value" ] [ text (String.fromInt model) ]
        , button [ onClick Increment, id "button-plus" ] [ text "+" ]
        , text "his beard was of FIRE and his staff a leaping flame."
        ]
