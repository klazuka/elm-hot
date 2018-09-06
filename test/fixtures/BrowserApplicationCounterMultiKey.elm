module BrowserApplicationCounterMultiKey exposing (Model, Msg(..), Page(..), getKey, init, loadPage, main, update, view)

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


type alias Model =
    { count : Int
    , page : Page
    }


{-| IMPORTANT: store the Nav.Key in the variants of a union type to make sure that we can restore it during HMR
-}
type Page
    = NotFound Nav.Key
    | Incrementer Nav.Key
    | Decrementer Nav.Key


init : () -> Url -> Nav.Key -> ( Model, Cmd Msg )
init flags url key =
    ( loadPage url
        { count = 0
        , page = NotFound key
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
                    ( model, Nav.pushUrl (getKey model.page) (Url.toString url) )

                Browser.External href ->
                    ( model, Nav.load href )

        UrlChanged url ->
            ( loadPage url model
            , Cmd.none
            )


getKey : Page -> Nav.Key
getKey page =
    case page of
        NotFound key ->
            key

        Incrementer key ->
            key

        Decrementer key ->
            key


loadPage : Url -> Model -> Model
loadPage url model =
    { model
        | page =
            case url.fragment of
                Nothing ->
                    Incrementer (getKey model.page)

                Just "/incrementer" ->
                    Incrementer (getKey model.page)

                Just "/decrementer" ->
                    Decrementer (getKey model.page)

                _ ->
                    NotFound (getKey model.page)
    }


view model =
    let
        pageBody =
            case model.page of
                Incrementer _ ->
                    div [ id "incrementer" ]
                        [ h1 [] [ text "Incrementer" ]
                        , p []
                            [ text "Counter value is: "
                            , span [ id "counter-value" ] [ text (String.fromInt model.count) ]
                            ]
                        , button [ onClick Increment, id "counter-button" ] [ text "+" ]
                        , p [] [ text "Switch to ", a [ id "nav-decrement", href "#/decrementer" ] [ text "decrementer" ] ]
                        ]

                Decrementer _ ->
                    div [ id "decrementer" ]
                        [ h1 [] [ text "Decrementer" ]
                        , p []
                            [ text "Counter value is: "
                            , span [ id "counter-value" ] [ text (String.fromInt model.count) ]
                            ]
                        , button [ onClick Decrement, id "counter-button" ] [ text "-" ]
                        , p [] [ text "Switch to ", a [ id "nav-increment", href "#/incrementer" ] [ text "incrementer" ] ]
                        ]

                NotFound _ ->
                    text "Page not found"
    in
    { title = "BrowserApplicationCounterMultiKey"
    , body =
        [ span [ id "code-version" ] [ text "code: v1" ]
        , pageBody
        ]
    }
