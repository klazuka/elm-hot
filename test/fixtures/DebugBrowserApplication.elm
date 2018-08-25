module DebugBrowserApplication exposing (..)

import Browser exposing (UrlRequest)
import Browser.Navigation as Nav
import Html exposing (a, button, div, h1, p, span, text)
import Html.Attributes exposing (href, id)
import Html.Events exposing (onClick)
import Url exposing (Url)


main =
    Browser.application
        { init = init
        , view = view
        , update = update
        , subscriptions = \_ -> Sub.none
        , onUrlRequest = LinkClicked
        , onUrlChange = UrlChanged
        }


type alias Flags =
    { n : Int }


type alias Model =
    { count : Int
    , myNavKey : Nav.Key
    , page : Page
    }


type Page
    = NotFound
    | Incrementer
    | Decrementer


init : Flags -> Url -> Nav.Key -> ( Model, Cmd Msg )
init flags url key =
    ( loadPage url
        { count = flags.n
        , myNavKey = key
        , page = NotFound
        }
    , Cmd.none
    )


type Msg
    = Increment
    | Decrement
    | LinkClicked UrlRequest
    | UrlChanged Url


update msg model =
    case msg of
        Increment ->
            ( { model | count = model.count + 1 }
            , Cmd.none
            )

        Decrement ->
            ( { model | count = model.count - 1 }
            , Cmd.none
            )

        LinkClicked req ->
            case req of
                Browser.Internal url ->
                    ( model, Nav.pushUrl model.myNavKey (Url.toString url) )

                Browser.External href ->
                    ( model, Nav.load href )

        UrlChanged url ->
            ( loadPage url model
            , Cmd.none
            )


loadPage : Url -> Model -> Model
loadPage url model =
    { model
        | page =
            case url.fragment of
                Nothing ->
                    Incrementer

                Just "/incrementer" ->
                    Incrementer

                Just "/decrementer" ->
                    Decrementer

                _ ->
                    NotFound
    }


view model =
    let
        pageBody =
            case model.page of
                Incrementer ->
                    div [ id "incrementer" ]
                        [ h1 [] [ text "Incrementer" ]
                        , p []
                            [ text "Counter value is: "
                            , span [ id "counter-value" ] [ text (String.fromInt model.count) ]
                            ]
                        , button [ onClick Increment, id "counter-button" ] [ text "+" ]
                        , p [] [ text "Switch to ", a [ id "nav-decrement", href "#/decrementer" ] [ text "decrementer" ] ]
                        ]

                Decrementer ->
                    div [ id "decrementer" ]
                        [ h1 [] [ text "Decrementer" ]
                        , p []
                            [ text "Counter value is: "
                            , span [ id "counter-value" ] [ text (String.fromInt model.count) ]
                            ]
                        , button [ onClick Decrement, id "counter-button" ] [ text "-" ]
                        , p [] [ text "Switch to ", a [ id "nav-increment", href "#/incrementer" ] [ text "incrementer" ] ]
                        ]

                NotFound ->
                    text "Page not found"
    in
    { title = "DebugBrowserApplication"
    , body =
        [ span [ id "code-version" ] [ text "code: v1" ]
        , pageBody
        ]
    }
